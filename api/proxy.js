// Vercel API route để proxy requests và tránh CORS
export default async function handler(req, res) {
  // Chỉ cho phép GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  try {
    // Decode URL
    const targetUrl = decodeURIComponent(url);

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
      // Thêm timeout
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Target server returned ${response.status}`,
      });
    }

    const data = await response.text();

    // Set CORS headers để cho phép tất cả origins
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300"); // Cache 5 phút

    return res.status(200).send(data);
  } catch (error) {
    console.error("Proxy error:", error);

    // Set CORS headers ngay cả khi có lỗi
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
