// Proxy API để tránh CORS issues trên iOS Safari
const BASE_URL = "https://www.nogizaka46.com";

// Helper function để tạo proxy URL
export const createProxyUrl = (path, params = {}) => {
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();
  return `/api/proxy?url=${encodeURIComponent(
    BASE_URL + path + (queryString ? "?" + queryString : "")
  )}`;
};

// Fetch với proxy để tránh CORS
export const fetchWithProxy = async (path, params = {}, retries = 3) => {
  const proxyUrl = createProxyUrl(path, params);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
          "Cache-Control": "public, max-age=300",
          "X-Requested-With": "XMLHttpRequest",
          Pragma: "no-cache"
        },
        credentials: "omit",
        mode: "cors",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();

      // Kiểm tra nếu response có vẻ hợp lệ (không phải error page)
      if (data.includes("<!DOCTYPE html") || data.includes("<html")) {
        return data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.warn(`Proxy fetch attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        console.error("All proxy attempts failed:", error);
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};
