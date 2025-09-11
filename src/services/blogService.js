import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.nogizaka46.com";
const BLOG_URL = `${BASE_URL}/s/n46/diary/MEMBER/list`;
const MEMBER_CODE = "55390"; // Ichinose Miku's code

// Fetch tất cả các blog của member
export const fetchAllBlogs = async () => {
  try {
    let allBlogs = [];
    let currentPage = 0;
    let hasNextPage = true;

    while (hasNextPage) {
      const { blogs, nextPage } = await fetchBlogPage(currentPage);
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
const fetchBlogPage = async (page) => {
  try {
    const response = await axios.get(BLOG_URL, {
      params: {
        ct: MEMBER_CODE,
        page: page,
        ima: Math.floor(Date.now() / 1000),
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

    // Get member image
    const memberImg = $(".bd--hd__fig img").attr("src");

    return {
      id: blogId,
      title,
      date,
      content: content.html() || "",
      author: "一ノ瀬 美空",
      memberImage: memberImg ? `${BASE_URL}${memberImg}` : null,
    };
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

// Helper function to save blogs to file
export const saveBlogsToFile = async () => {
  const blogs = await fetchAllBlogs();
  const blogsJson = JSON.stringify(blogs, null, 2);

  // Tạo Blob và download file
  const blob = new Blob([blogsJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ichinose_blogs.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
