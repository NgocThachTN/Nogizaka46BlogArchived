import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());

// Custom proxy handler for Nogizaka46 API
app.get("/api/proxy", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    // Decode URL
    const targetUrl = decodeURIComponent(url);
    console.log("Proxying request to:", targetUrl);

    // Validate URL để đảm bảo an toàn
    if (!targetUrl.startsWith("https://www.nogizaka46.com/")) {
      return res.status(400).json({ error: "Invalid URL domain" });
    }

    // Fetch từ target URL
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Target server returned ${response.status}`,
      });
    }

    const data = await response.text();

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, Accept-Language, User-Agent"
    );
    res.setHeader("Access-Control-Allow-Credentials", "false");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300"); // Cache 5 phút

    return res.status(200).send(data);
  } catch (error) {
    console.error("Proxy error:", error);

    // Set CORS headers ngay cả khi có lỗi
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, Accept-Language, User-Agent"
    );
    res.setHeader("Access-Control-Allow-Credentials", "false");
    res.setHeader("Access-Control-Max-Age", "86400");

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Handle CORS preflight requests
app.options("/api/proxy", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Accept-Language, User-Agent"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.status(200).end();
});

app.listen(PORT, () => {
  console.log(`Local proxy server running on http://localhost:${PORT}`);
  console.log("Proxy endpoint: http://localhost:3001/api/proxy");
});
