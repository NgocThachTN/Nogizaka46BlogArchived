// Proxy API để tránh CORS issues trên iOS Safari
import { isIOS18Plus } from "../utils/deviceDetection.js";

const BASE_URL = "https://www.nogizaka46.com";

// Response cache để tránh gọi lại API nhiều lần
const _responseCache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 phút cache

// Helper function để tạo proxy URL
export const createProxyUrl = (path, params = {}) => {
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();
  return `/api/proxy?url=${encodeURIComponent(
    BASE_URL + path + (queryString ? "?" + queryString : "")
  )}`;
};

// Fetch với proxy để tránh CORS - Optimized with cache and reduced retries
export const fetchWithProxy = async (path, params = {}, retries = 2) => {
  // Check cache first
  const cacheKey = `${path}:${JSON.stringify(params)}`;
  const cached = _responseCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const proxyUrl = createProxyUrl(path, params);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = isIOS18Plus() ? 20000 : 15000; // Reduced timeout
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
          "Cache-Control": "public, max-age=300",
        },
        credentials: "omit",
        mode: "cors",
        signal: controller.signal,
        cache: "default",
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      const trimmed = (data || "").trim();

      if (trimmed.length > 0) {
        // Cache successful response
        _responseCache.set(cacheKey, { data: trimmed, ts: Date.now() });

        // Limit cache size
        if (_responseCache.size > 100) {
          const firstKey = _responseCache.keys().next().value;
          _responseCache.delete(firstKey);
        }

        return trimmed;
      }

      throw new Error("Invalid response format: empty body");
    } catch (error) {
      if (attempt === retries) {
        console.error("All proxy attempts failed:", error);
        throw error;
      }

      // Shorter backoff delay
      const delay = Math.pow(1.5, attempt) * 800;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
