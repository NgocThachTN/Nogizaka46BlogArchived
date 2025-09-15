// Proxy API để tránh CORS issues trên iOS Safari
import { isIOS18Plus } from "../utils/deviceDetection.js";

const BASE_URL = "https://www.nogizaka46.com";

// Helper function để tạo proxy URL
export const createProxyUrl = (path, params = {}) => {
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();
  return `/api/proxy?url=${encodeURIComponent(
    BASE_URL + path + (queryString ? "?" + queryString : "")
  )}`;
};

// Check if we're in localhost environment

// Fetch với proxy để tránh CORS
export const fetchWithProxy = async (path, params = {}, retries = 3) => {
  // Sử dụng proxy cho cả localhost và production
  const proxyUrl = createProxyUrl(path, params);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = isIOS18Plus() ? 25000 : 20000; // 25s timeout for iOS 18+
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
          "Cache-Control": "public, max-age=300",
          "X-Requested-With": "XMLHttpRequest",
          Pragma: "no-cache",
          // iOS Safari specific headers
          "Accept-Encoding": "gzip, deflate, br",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
        },
        credentials: "omit",
        mode: "cors",
        signal: controller.signal,
        // iOS Safari specific options
        cache: "default",
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();

      // Chấp nhận mọi response không rỗng. Một số endpoint trả JSONP (res(...))
      // hoặc HTML tối giản không chứa <!DOCTYPE>.
      const trimmed = (data || "").trim();
      if (trimmed.length > 0) return trimmed;
      throw new Error("Invalid response format: empty body");
    } catch (error) {
      console.warn(`Proxy fetch attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        console.error("All proxy attempts failed:", error);
        throw error;
      }

      // Exponential backoff with longer delays for iOS
      const delay = Math.pow(2, attempt) * 1000 + attempt * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
