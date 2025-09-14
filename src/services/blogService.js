import axios from "axios";
import * as cheerio from "cheerio";
import { fetchWithProxy } from "../api/proxy.js";
import {
  shouldUseProxy,
  getUserAgent,
  isIOS,
  isSafari,
} from "../utils/deviceDetection.js";

const BASE_URL = "https://www.nogizaka46.com";
const BLOG_URL = `/s/n46/diary/MEMBER/list`;

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
    // Xử lý member đặc biệt 40008 (特別メンバー) - không có blog thực tế
    if (String(memberCode) === "40008") {
      console.log("Special member 40008 - returning empty blog list");
      return [];
    }

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
    // Sử dụng proxy để tránh CORS issues trên iOS
    const params = {
      ct: memberCode,
      page: page,
      ima: Math.floor(Date.now() / 1000), // Timestamp hiện tại
    };

    let htmlData;
    if (shouldUseProxy()) {
      try {
        // Sử dụng proxy cho iOS Safari
        htmlData = await fetchWithProxy(BLOG_URL, params);
      } catch (proxyError) {
        console.warn("Proxy failed, trying direct request:", proxyError);
        // Fallback về direct request nếu proxy fail
        const response = await axios.get(`${BASE_URL}${BLOG_URL}`, {
          params,
          headers: {
            "User-Agent": getUserAgent(),
          },
        });
        htmlData = response.data;
      }
    } else {
      // Sử dụng direct request cho các browser khác
      const response = await axios.get(`${BASE_URL}${BLOG_URL}`, {
        params,
        headers: {
          "User-Agent": getUserAgent(),
        },
      });
      htmlData = response.data;
    }

    const $ = cheerio.load(htmlData);
    const blogs = [];

    $("a.bl--card").each((_, element) => {
      const link = $(element).attr("href");
      const blogId = link.match(/detail\/(\d+)/)[1];
      const title = $(element).find(".bl--card__ttl").text().trim();
      const date = $(element).find(".bl--card__date").text().trim();

      // Get image from data-src attribute
      const imgElement = $(element).find(".m--bg.js-bg");
      const img = imgElement.attr("data-src") || "";

      const author = $(element).find(".bl--card__name").text().trim();

      blogs.push({
        id: blogId,
        title,
        date,
        link: `${BASE_URL}${link}`,
        thumbnail: img,
        author,
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
    // Fetch blog content sử dụng proxy
    const params = {
      cd: "MEMBER",
      ima: Math.floor(Date.now() / 1000),
    };

    let htmlData;
    if (shouldUseProxy()) {
      try {
        // Sử dụng proxy cho iOS Safari
        htmlData = await fetchWithProxy(
          `/s/n46/diary/detail/${blogId}`,
          params
        );
      } catch (proxyError) {
        console.warn(
          "Proxy failed for blog detail, trying direct request:",
          proxyError
        );
        // Fallback về direct request
        const response = await axios.get(
          `${BASE_URL}/s/n46/diary/detail/${blogId}`,
          {
            params,
            headers: {
              "User-Agent": getUserAgent(),
            },
          }
        );
        htmlData = response.data;
      }
    } else {
      // Sử dụng direct request cho các browser khác
      const response = await axios.get(
        `${BASE_URL}/s/n46/diary/detail/${blogId}`,
        {
          params,
          headers: {
            "User-Agent": getUserAgent(),
          },
        }
      );
      htmlData = response.data;
    }

    const $ = cheerio.load(htmlData);

    // Try multiple selectors for title - prioritize meta tags
    let title = $('meta[property="og:title"]').attr("content")?.trim();
    console.log("Title from og:title meta:", title);

    if (!title) {
      title = $('meta[name="twitter:title"]').attr("content")?.trim();
      console.log("Title from twitter:title meta:", title);
    }
    if (!title) {
      title = $(".bd--title").text().trim();
      console.log("Title from .bd--title:", title);
    }
    if (!title) {
      title = $("h1").text().trim();
      console.log("Title from h1:", title);
    }
    if (!title) {
      title = $(".bd--hd__ttl").text().trim();
      console.log("Title from .bd--hd__ttl:", title);
    }
    if (!title) {
      title = $(".bd--hd h1").text().trim();
      console.log("Title from .bd--hd h1:", title);
    }
    if (!title) {
      title = $(".bd--hd__ttl h1").text().trim();
      console.log("Title from .bd--hd__ttl h1:", title);
    }
    if (!title) {
      title = $(".bd--hd__ttl h2").text().trim();
      console.log("Title from .bd--hd__ttl h2:", title);
    }
    if (!title) {
      title = $(".bd--hd__ttl h3").text().trim();
      console.log("Title from .bd--hd__ttl h3:", title);
    }
    if (!title) {
      title = $(".bd--hd__ttl").find("h1, h2, h3").first().text().trim();
      console.log("Title from .bd--hd__ttl first heading:", title);
    }
    if (!title) {
      title = $(".bd--hd").find("h1, h2, h3").first().text().trim();
      console.log("Title from .bd--hd first heading:", title);
    }
    if (!title) {
      title = $("title").text().trim();
      console.log("Title from title tag:", title);
    }

    // Debug: log all possible title elements
    console.log(
      "All h1 elements:",
      $("h1")
        .map((i, el) => $(el).text().trim())
        .get()
    );
    console.log(
      "All elements with 'title' in class:",
      $("[class*='title']")
        .map((i, el) => $(el).text().trim())
        .get()
    );
    console.log(
      "All elements in .bd--hd:",
      $(".bd--hd")
        .find("*")
        .map((i, el) => $(el).text().trim())
        .get()
    );
    console.log(
      "All h2 elements:",
      $("h2")
        .map((i, el) => $(el).text().trim())
        .get()
    );
    console.log(
      "All h3 elements:",
      $("h3")
        .map((i, el) => $(el).text().trim())
        .get()
    );
    console.log("All text content in .bd--hd:", $(".bd--hd").text());
    console.log("All text content in .bd--hd__ttl:", $(".bd--hd__ttl").text());
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

    // Try to fetch member info for avatar image, but don't block on failure
    let memberImage = null;
    try {
      let memberData;
      if (shouldUseProxy()) {
        try {
          memberData = await fetchWithProxy("/s/n46/api/list/member", {
            callback: "res",
          });
        } catch (proxyError) {
          console.warn(
            "Proxy failed for member info, trying direct request:",
            proxyError
          );
          const response = await axios.get(
            `${BASE_URL}/s/n46/api/list/member?callback=res`,
            {
              responseType: "text",
              headers: {
                "User-Agent": getUserAgent(),
              },
            }
          );
          memberData = response.data;
        }
      } else {
        const response = await axios.get(
          `${BASE_URL}/s/n46/api/list/member?callback=res`,
          {
            responseType: "text",
            headers: {
              "User-Agent": getUserAgent(),
            },
          }
        );
        memberData = response.data;
      }

      if (memberData) {
        const jsonStr = memberData.replace(/^res\(/, "").replace(/\);?$/, "");
        const memberApi = JSON.parse(jsonStr);
        const memberInfo = memberApi.data.find((m) => m.code === memberCode);
        memberImage = memberInfo?.img || null;
      }
    } catch (memberError) {
      console.warn("Failed to fetch member info:", memberError);
    }

    // Get original URL
    const originalUrl = `${BASE_URL}/s/n46/diary/detail/${blogId}?cd=MEMBER`;

    const detail = {
      id: blogId,
      title,
      date,
      content: content.html() || "",
      memberCode,
      author,
      memberImage,
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

    // Xử lý member đặc biệt 40008 (特別メンバー)
    if (String(memberCode) === "40008") {
      const specialMember = {
        code: "40008",
        name: "特別メンバー",
        english_name: "Special Member",
        kana: "とくべつめんばー",
        cate: "6期生",
        groupcode: "6期生",
        img: "https://via.placeholder.com/300x300?text=Special+Member",
        birthday: "2000/01/01",
        blood: "A型",
        constellation: "やぎ座",
        graduation: "NO",
        link: "https://www.nogizaka46.com",
      };
      console.log("Returning special member:", specialMember);
      return specialMember;
    }

    console.log("shouldUseProxy():", shouldUseProxy());
    console.log("isIOS():", isIOS());
    console.log("isSafari():", isSafari());

    let memberData;
    if (shouldUseProxy()) {
      console.log("Using proxy for member info...");
      try {
        memberData = await fetchWithProxy("/s/n46/api/list/member", {
          callback: "res",
        });
        console.log("Proxy success, data length:", memberData?.length || 0);
      } catch (proxyError) {
        console.warn(
          "Proxy failed for member info, trying direct request:",
          proxyError
        );
        const response = await axios.get(
          `${BASE_URL}/s/n46/api/list/member?callback=res`,
          {
            responseType: "text",
            headers: {
              "User-Agent": getUserAgent(),
            },
          }
        );
        memberData = response.data;
        console.log(
          "Direct request success, data length:",
          memberData?.length || 0
        );
      }
    } else {
      console.log("Using direct request for member info...");
      const response = await axios.get(
        `${BASE_URL}/s/n46/api/list/member?callback=res`,
        {
          responseType: "text",
          headers: {
            "User-Agent": getUserAgent(),
          },
        }
      );
      memberData = response.data;
      console.log(
        "Direct request success, data length:",
        memberData?.length || 0
      );
    }

    console.log("Raw member data preview:", memberData?.substring(0, 200));

    const jsonStr = memberData.replace(/^res\(/, "").replace(/\);?$/, "");
    console.log("Parsed JSON string length:", jsonStr.length);

    const api = JSON.parse(jsonStr);
    console.log("API data length:", api.data?.length || 0);
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
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return null;
  }
};

// Fetch member info by exact name match (fallback when code is missing)
export const fetchMemberInfoByName = async (memberName) => {
  try {
    if (!memberName) return null;
    console.log("Fetching member info for name:", memberName);

    // Xử lý member đặc biệt 特別メンバー
    if (memberName === "特別メンバー" || memberName === "Special Member") {
      const specialMember = {
        code: "40008",
        name: "特別メンバー",
        english_name: "Special Member",
        kana: "とくべつめんばー",
        cate: "6期生",
        groupcode: "6期生",
        img: "https://via.placeholder.com/300x300?text=Special+Member",
        birthday: "2000/01/01",
        blood: "A型",
        constellation: "やぎ座",
        graduation: "NO",
        link: "https://www.nogizaka46.com",
      };
      console.log("Returning special member by name:", specialMember);
      return specialMember;
    }
    let memberData;
    if (shouldUseProxy()) {
      try {
        memberData = await fetchWithProxy("/s/n46/api/list/member", {
          callback: "res",
        });
      } catch (proxyError) {
        console.warn(
          "Proxy failed for member info by name, trying direct request:",
          proxyError
        );
        const response = await axios.get(
          `${BASE_URL}/s/n46/api/list/member?callback=res`,
          {
            responseType: "text",
            headers: {
              "User-Agent": getUserAgent(),
            },
          }
        );
        memberData = response.data;
      }
    } else {
      const response = await axios.get(
        `${BASE_URL}/s/n46/api/list/member?callback=res`,
        {
          responseType: "text",
          headers: {
            "User-Agent": getUserAgent(),
          },
        }
      );
      memberData = response.data;
    }

    const jsonStr = memberData.replace(/^res\(/, "").replace(/\);?$/, "");
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
