import axios from "axios";
import * as cheerio from "cheerio";
import { fetchWithProxy } from "../api/proxy.js";
import {
  shouldUseProxy,
  getUserAgent,
} from "../utils/deviceDetection.js";

const BASE_URL = "https://www.nogizaka46.com";
const BLOG_URL = `/s/n46/diary/MEMBER/list`;

// Enhanced caching system
const _detailCache = new Map(); // key: blogId -> blog detail object
const _memberListCache = { data: null, ts: 0 }; // Cache member list API (10 min TTL)
const _blogPageCache = new Map(); // key: `${memberCode}:${page}` -> { blogs, nextPage, ts }
const MEMBER_CACHE_MS = 1000 * 60 * 10; // 10 minutes
const PAGE_CACHE_MS = 1000 * 60 * 5; // 5 minutes

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
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
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

  const jsonStr = memberData.replace(/^res\(/, "").replace(/\);?$/, "");
  const api = JSON.parse(jsonStr);
  _memberListCache.data = api.data;
  _memberListCache.ts = now;
  return api.data;
};

// Fetch thông tin member từ code - Optimized with cache
export const fetchMemberInfo = async (memberCode) => {
  try {
    const normalizedCode = String(memberCode).trim();

    if (normalizedCode === "40008" || normalizedCode === "40008.0") {
      return {
        code: "40008",
        name: "6期生リレー",
        cate: "6期生",
        groupcode: "6期生",
        graduation: "NO",
      };
    }

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
