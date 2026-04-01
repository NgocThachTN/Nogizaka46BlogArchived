// @ts-nocheck
import axios from "axios";
import * as cheerio from "cheerio";
import { fetchWithProxy } from "../../../lib/api/proxy";
import {
  shouldUseProxy,
  getUserAgent,
} from "../../../lib/utils/deviceDetection";
import {
  shouldUseLocalDB,
  getFolderFromMemberCode,
  loadLocalBlogs,
  loadLocalMemberInfo,
  getMemberCodeFromFolder,
} from "../data/localBlogLoader";
import {
  loadGraduatedMember,
  isGraduatedMember,
} from "../../members/data/graduatedMembersLoader";

const BASE_URL = "https://www.nogizaka46.com";
const BLOG_URL = `/s/n46/diary/MEMBER/list`;

// Enhanced caching system
const _detailCache = new Map(); // key: blogId -> blog detail object
const _memberListCache = { data: null, ts: 0 }; // Cache member list API (10 min TTL)
const _blogPageCache = new Map(); // key: `${memberCode}:${page}` -> { blogs, nextPage, ts }
const MEMBER_CACHE_MS = 1000 * 60 * 10; // 10 minutes
const PAGE_CACHE_MS = 1000 * 60 * 5; // 5 minutes

const parseMemberListResponse = (memberData) => {
  if (Array.isArray(memberData)) return memberData;
  if (memberData && typeof memberData === "object" && Array.isArray(memberData.data)) {
    return memberData.data;
  }
  if (typeof memberData !== "string") {
    throw new Error("Invalid member list response type");
  }

  const trimmed = memberData.trim();
  const jsonStr = trimmed.startsWith("res(")
    ? trimmed.replace(/^res\(/, "").replace(/\);?$/, "")
    : trimmed;
  const api = JSON.parse(jsonStr);

  if (Array.isArray(api)) return api;
  if (api && Array.isArray(api.data)) return api.data;

  throw new Error("Member list payload missing data array");
};

export const getCachedBlogDetail = (blogId) => _detailCache.get(String(blogId));
export const prefetchBlogDetail = async (blogId) => {
  try {
    const key = String(blogId);
    if (_detailCache.has(key)) return _detailCache.get(key);
    const d = await fetchBlogDetail(blogId);
    if (d) _detailCache.set(key, d);
    return d;
  } catch {
    return undefined;
  }
};
// Fetch tất cả các blog của member với parallel fetching + progress callback
export const fetchAllBlogs = async (memberCode, { onProgress, signal } = {}) => {
  try {
    // ===== EXCEPTION: Try local database first =====
    if (shouldUseLocalDB()) {
      const folderName = getFolderFromMemberCode(memberCode);
      if (folderName) {
        console.log(`🗂️ Attempting to load from local DB: ${folderName}`);
        const localBlogs = await loadLocalBlogs(folderName);

        if (localBlogs.length > 0) {
          console.log(`✅ Loaded ${localBlogs.length} blogs from local DB`);

          // Get member info from local
          const memberInfo = await loadLocalMemberInfo(folderName);

          // Enhance blogs with member info
          const enhancedBlogs = localBlogs.map(blog => ({
            ...blog,
            author: memberInfo?.name || blog.author,
            memberCode: memberCode,
          }));

          // Simulate progress callback
          if (onProgress) {
            onProgress(enhancedBlogs, true); // true = complete
          }

          return enhancedBlogs;
        } else {
          console.warn(`⚠️ Local DB empty for ${folderName}, falling back to API`);
        }
      }
    }
    // ===== END EXCEPTION =====

    let allBlogs = [];
    let currentPage = 0;
    let hasNextPage = true;

    // Fetch first page để xác định có bao nhiêu trang - PRIORITY: Show immediately
    const firstPageResult = await fetchBlogPage(currentPage, memberCode);
    allBlogs = firstPageResult.blogs;
    hasNextPage = firstPageResult.nextPage;
    currentPage++;

    // Call progress callback with first page data immediately
    if (onProgress && allBlogs.length > 0) {
      onProgress(allBlogs, false); // false = not complete yet
    }

    // Nếu có nhiều trang, fetch parallel (tối đa 3 trang cùng lúc để tránh Vercel throttle)
    const parallelPages = [];
    const MAX_PARALLEL = 3; // Reduced from 5 - Vercel has rate limits

    while (hasNextPage && currentPage < 50) { // Safety limit: 50 pages max
      if (signal?.aborted) break; // Support cancellation

      parallelPages.push(currentPage);
      currentPage++;

      // Fetch theo batch để tránh quá tải
      if (parallelPages.length >= MAX_PARALLEL) {
        const results = await Promise.allSettled(
          parallelPages.map(p => fetchBlogPage(p, memberCode))
        );

        let hasAnyNext = false;
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            allBlogs = [...allBlogs, ...result.value.blogs];
            if (result.value.nextPage) hasAnyNext = true;
          }
        });

        hasNextPage = hasAnyNext;
        parallelPages.length = 0; // Clear array

        // Progress update after each batch
        if (onProgress) {
          onProgress(allBlogs, !hasNextPage);
        }
      }
    }

    // Fetch remaining pages
    if (parallelPages.length > 0 && !signal?.aborted) {
      const results = await Promise.allSettled(
        parallelPages.map(p => fetchBlogPage(p, memberCode))
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allBlogs = [...allBlogs, ...result.value.blogs];
        }
      });
    }

    // Final progress update
    if (onProgress) {
      onProgress(allBlogs, true); // true = complete
    }

    return allBlogs;
  } catch (error) {
    console.error("Error fetching all blogs:", error);
    return [];
  }
};

// Fetch một trang blog với cache
const fetchBlogPage = async (page, memberCode) => {
  try {
    // Check cache first
    const cacheKey = `${memberCode}:${page}`;
    const cached = _blogPageCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < PAGE_CACHE_MS) {
      return { blogs: cached.blogs, nextPage: cached.nextPage };
    }

    const params = {
      ct: memberCode,
      page: page,
      ima: Math.floor(Date.now() / 1000),
    };

    let htmlData;
    if (shouldUseProxy()) {
      try {
        htmlData = await fetchWithProxy(BLOG_URL, params);
      } catch {
        const response = await axios.get(`${BASE_URL}${BLOG_URL}`, {
          params,
          headers: { "User-Agent": getUserAgent() },
        });
        htmlData = response.data;
      }
    } else {
      const response = await axios.get(`${BASE_URL}${BLOG_URL}`, {
        params,
        headers: { "User-Agent": getUserAgent() },
      });
      htmlData = response.data;
    }

    const $ = cheerio.load(htmlData, {
      xml: false,
      decodeEntities: false // Faster parsing
    });
    const blogs = [];

    $("a.bl--card").each((_, element) => {
      const link = $(element).attr("href");
      const blogIdMatch = link?.match(/detail\/(\d+)/);
      if (!blogIdMatch) return;

      const $el = $(element);
      blogs.push({
        id: blogIdMatch[1],
        title: $el.find(".bl--card__ttl").text().trim(),
        date: $el.find(".bl--card__date").text().trim(),
        link: `${BASE_URL}${link}`,
        thumbnail: $el.find(".m--bg.js-bg").attr("data-src") || "",
        author: $el.find(".bl--card__name").text().trim(),
      });
    });

    const hasNextPage = $(".pager li.next a").length > 0;

    // Cache result
    _blogPageCache.set(cacheKey, { blogs, nextPage: hasNextPage, ts: Date.now() });

    return { blogs, nextPage: hasNextPage };
  } catch (error) {
    console.error(`Error fetching blog page ${page}:`, error);
    return { blogs: [], nextPage: false };
  }
};

// Fetch chi tiết một blog - Optimized with minimal parsing
export const fetchBlogDetail = async (blogId) => {
  try {
    // ===== EXCEPTION: Check local database first =====
    if (shouldUseLocalDB()) {
      // Try all member folders to find the blog
      const folders = ["asuka.saito", "erika.ikuta", "nanase.nishino", "mizuki.yamashita", "momoko.oozono", "nanami.hashimoto"];

      for (const folderName of folders) {
        try {
          const localBlogs = await loadLocalBlogs(folderName);
          const localBlog = localBlogs.find(b => b.id === String(blogId) || b.originalUrl.includes(blogId));

          if (localBlog) {
            console.log(`✅ Found blog ${blogId} in local DB: ${folderName}`);

            // Get member info
            const memberInfo = await loadLocalMemberInfo(folderName);
            const memberCode = getMemberCodeFromFolder(folderName);

            const detail = {
              ...localBlog,
              author: memberInfo?.name || localBlog.author,
              memberCode: memberCode,
              memberImage: memberInfo?.image || null,
            };

            _detailCache.set(String(blogId), detail);
            return detail;
          }
        } catch {
          // Continue to next folder
          continue;
        }
      }

      console.warn(`⚠️ Blog ${blogId} not found in local DB, falling back to API`);
    }
    // ===== END EXCEPTION =====

    const params = {
      cd: "MEMBER",
      ima: Math.floor(Date.now() / 1000),
    };

    let htmlData;
    if (shouldUseProxy()) {
      try {
        htmlData = await fetchWithProxy(`/s/n46/diary/detail/${blogId}`, params);
      } catch {
        const response = await axios.get(`${BASE_URL}/s/n46/diary/detail/${blogId}`, {
          params,
          headers: { "User-Agent": getUserAgent() },
        });
        htmlData = response.data;
      }
    } else {
      const response = await axios.get(`${BASE_URL}/s/n46/diary/detail/${blogId}`, {
        params,
        headers: { "User-Agent": getUserAgent() },
      });
      htmlData = response.data;
    }

    const $ = cheerio.load(htmlData, {
      xml: false,
      decodeEntities: false
    });

    // Optimized title extraction - prioritize meta tags (fastest)
    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim() ||
      $(".bd--hd__ttl").text().trim() ||
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      "Untitled";

    const date = $(".bd--hd__date").text().trim();
    const content = $(".bd--edit");

    // Process images efficiently
    content.find("img").each((_, img) => {
      const src = $(img).attr("src");
      if (src && src.startsWith("/")) {
        $(img).attr("src", `${BASE_URL}${src}`);
      }
    });

    const profileLink = $(".bd--prof__link").attr("href");
    const memberCode = profileLink?.match(/\/artist\/(\d+)/)?.[1];
    const author = $(".bd--prof__name").text().trim();

    // Fetch member info parallel (non-blocking)
    let memberImage = null;
    fetchMemberListAPI()
      .then(data => {
        const memberInfo = data?.find(m => m.code === memberCode);
        if (memberInfo) memberImage = memberInfo.img;
      })
      .catch(() => {/* Silent fail */ });

    const detail = {
      id: blogId,
      title,
      date,
      content: content.html() || "",
      memberCode,
      author,
      memberImage,
      originalUrl: `${BASE_URL}/s/n46/diary/detail/${blogId}?cd=MEMBER`,
    };

    _detailCache.set(String(blogId), detail);
    return detail;
  } catch (error) {
    console.error("Error fetching blog detail:", error);
    return null;
  }
};

// Helper function to get image URL
// Helper function to get image URL
export const getImageUrl = (imagePath, options = {}) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;

  // ===== Handle local database paths =====
  if (imagePath.startsWith("/blogdb/")) {
    // Local database image - return as-is (will be resolved by public folder)
    // Ignore width/resize options for local images (no CDN/resize API)
    return imagePath;
  }
  // ===== END local database handling =====

  // Online API image path (with optional width param for CDN resize)
  let url = `${BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;

  // Add width param if provided (for online CDN resize)
  if (options.w) {
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}w=${options.w}`;
  }

  return url;
};

// Cached member list API fetch
const fetchMemberListAPI = async () => {
  const now = Date.now();
  if (_memberListCache.data && now - _memberListCache.ts < MEMBER_CACHE_MS) {
    return _memberListCache.data;
  }

  let memberData;
  if (shouldUseProxy()) {
    try {
      memberData = await fetchWithProxy("/s/n46/api/list/member", { callback: "res" });
    } catch {
      const response = await axios.get(`${BASE_URL}/s/n46/api/list/member?callback=res`, {
        responseType: "text",
        headers: { "User-Agent": getUserAgent() },
      });
      memberData = response.data;
    }
  } else {
    const response = await axios.get(`${BASE_URL}/s/n46/api/list/member?callback=res`, {
      responseType: "text",
      headers: { "User-Agent": getUserAgent() },
    });
    memberData = response.data;
  }

  const parsedMembers = parseMemberListResponse(memberData);
  _memberListCache.data = parsedMembers;
  _memberListCache.ts = now;
  return parsedMembers;
};

// Fetch thông tin member từ code - Optimized with cache
export const fetchMemberInfo = async (memberCode) => {
  try {
    const normalizedCode = String(memberCode).trim();

    // ===== PRIORITY 1: Check graduated members from local DB =====
    if (shouldUseLocalDB()) {
      const graduatedMember = await loadGraduatedMember(normalizedCode);
      if (graduatedMember) {
        console.log(`✅ Loaded graduated member ${normalizedCode} from local DB:`, graduatedMember.name);
        return graduatedMember;
      }
    }
    // ===== END PRIORITY 1 =====

    // Special case for 6期生リレー
    if (normalizedCode === "40008" || normalizedCode === "40008.0") {
      return {
        code: "40008",
        name: "6期生リレー",
        cate: "6期生",
        groupcode: "6期生",
        graduation: "NO",
      };
    }

    // PRIORITY 2: Fetch from online API
    const members = await fetchMemberListAPI();
    const member = members.find(m => String(m.code).trim() === normalizedCode);
    return member || null;
  } catch (error) {
    console.error("Error fetching member info:", error);
    return null;
  }
};

// Prefetch member info để cache sẵn (gọi khi hover)
export const prefetchMemberInfo = async () => {
  try {
    // Just trigger fetchMemberListAPI to cache it
    await fetchMemberListAPI();
  } catch {
    // Silent fail
  }
};

// Fetch member info by exact name match
export const fetchMemberInfoByName = async (memberName) => {
  try {
    if (!memberName) return null;

    const normalizedName = (memberName || "").trim();
    if (normalizedName === "6期生リレー" || normalizedName === "6th Gen Relay" || normalizedName.includes("6期生")) {
      return {
        code: "40008",
        name: "6期生リレー",
        cate: "6期生",
        groupcode: "6期生",
        graduation: "NO",
      };
    }

    const members = await fetchMemberListAPI();
    const normalize = (s) => (s || "").replace(/\s+/g, "").trim();
    const target = normalize(memberName);
    const member = members.find(m => normalize(m.name) === target);
    return member || null;
  } catch (error) {
    console.error("Error fetching member by name:", error);
    return null;
  }
};
