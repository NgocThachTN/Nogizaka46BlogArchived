import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.nogizaka46.com";
const BLOG_URL = `${BASE_URL}/s/n46/diary/MEMBER/list`;

// Lightweight in-memory cache for blog details to speed up navigation
const _detailCache = new Map(); // key: blogId -> blog detail object

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
// Fetch tất cả các blog của member
export const fetchAllBlogs = async (memberCode) => {
  try {
    let allBlogs = [];
    let currentPage = 0;
    let hasNextPage = true;

    while (hasNextPage) {
      const { blogs, nextPage } = await fetchBlogPage(currentPage, memberCode);
      allBlogs = [...allBlogs, ...blogs];
      hasNextPage = nextPage;
      currentPage++;
    }

    return allBlogs;
  } catch (error) {
    console.error("Error fetching all blogs:", error);
    return [];
  }
};

// Fetch một trang blog
const fetchBlogPage = async (page, memberCode) => {
  try {
    const response = await axios.get(BLOG_URL, {
      params: {
        ct: memberCode,
        page: page,
        ima: Math.floor(Date.now() / 1000), // Timestamp hiện tại
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const blogs = [];

    $("a.bl--card").each((_, element) => {
      const link = $(element).attr("href");
      const blogId = link.match(/detail\/(\d+)/)[1];
      const title = $(element).find(".bl--card__ttl").text().trim();
      const date = $(element).find(".bl--card__date").text().trim();

      // Get image from data-src attribute
      const imgElement = $(element).find(".m--bg.js-bg");
      const img = imgElement.attr("data-src") || "";

      blogs.push({
        id: blogId,
        title,
        date,
        link: `${BASE_URL}${link}`,
        thumbnail: img,
        author: "一ノ瀬 美空",
      });
    });

    // Kiểm tra có trang tiếp theo không - tìm nút ">" trong pagination
    const hasNextPage = $(".pager li.next a").length > 0;

    return {
      blogs,
      nextPage: hasNextPage,
    };
  } catch (error) {
    console.error(`Error fetching blog page ${page}:`, error);
    return { blogs: [], nextPage: false };
  }
};

// Fetch chi tiết một blog
export const fetchBlogDetail = async (blogId) => {
  try {
    // Fetch blog content
    const response = await axios.get(
      `${BASE_URL}/s/n46/diary/detail/${blogId}`,
      {
        params: {
          cd: "MEMBER",
          ima: Math.floor(Date.now() / 1000),
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    const $ = cheerio.load(response.data);

    const title = $(".bd--title").text().trim();
    const date = $(".bd--hd__date").text().trim();
    const content = $(".bd--edit");

    // Process images in content
    content.find("img").each((_, img) => {
      const src = $(img).attr("src");
      if (src && src.startsWith("/")) {
        $(img).attr("src", `${BASE_URL}${src}`);
      }
    });

    // Get member code from URL and name
    const profileLink = $(".bd--prof__link").attr("href");
    console.log("Profile link found:", profileLink);

    // Extract member code from URL pattern like: /s/n46/artist/55384
    const memberCode = profileLink?.match(/\/artist\/(\d+)/)?.[1];
    console.log("Extracted member code:", memberCode);

    const author = $(".bd--prof__name").text().trim();
    console.log("Author name from blog:", author);

    // Fetch member info to get correct image
    const memberResponse = await axios.get(
      `${BASE_URL}/s/n46/api/list/member?callback=res`,
      {
        responseType: "text",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    const jsonStr = memberResponse.data
      .replace(/^res\(/, "")
      .replace(/\);?$/, "");
    const memberApi = JSON.parse(jsonStr);
    const memberInfo = memberApi.data.find((m) => m.code === memberCode);

    // Get original URL
    const originalUrl = `${BASE_URL}/s/n46/diary/detail/${blogId}?cd=MEMBER`;

    const detail = {
      id: blogId,
      title,
      date,
      content: content.html() || "",
      memberCode,
      author,
      memberImage: memberInfo?.img || null,
      originalUrl,
    };

    // cache the result for instant reuse
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

// Fetch thông tin member từ code
export const fetchMemberInfo = async (memberCode) => {
  try {
    console.log("Fetching member info for code:", memberCode);
    const response = await axios.get(
      `${BASE_URL}/s/n46/api/list/member?callback=res`,
      {
        responseType: "text",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );
    const jsonStr = response.data.replace(/^res\(/, "").replace(/\);?$/, "");
    const api = JSON.parse(jsonStr);
    console.log("Looking for member with code:", memberCode);
    const member = api.data.find((m) => String(m.code) === String(memberCode));
    console.log("Found member:", member);

    if (!member) {
      console.log(
        "All available members:",
        api.data.map((m) => ({ code: m.code, name: m.name }))
      );
    }
    return member || null;
  } catch (error) {
    console.error("Error fetching member info:", error);
    return null;
  }
};

// Fetch member info by exact name match (fallback when code is missing)
export const fetchMemberInfoByName = async (memberName) => {
  try {
    if (!memberName) return null;
    console.log("Fetching member info for name:", memberName);
    const response = await axios.get(
      `${BASE_URL}/s/n46/api/list/member?callback=res`,
      {
        responseType: "text",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );
    const jsonStr = response.data.replace(/^res\(/, "").replace(/\);?$/, "");
    const api = JSON.parse(jsonStr);
    const normalize = (s) => (s || "").replace(/\s+/g, "").trim();
    const target = normalize(memberName);
    const member = api.data.find((m) => normalize(m.name) === target);
    return member || null;
  } catch (error) {
    console.error("Error fetching member by name:", error);
    return null;
  }
};
