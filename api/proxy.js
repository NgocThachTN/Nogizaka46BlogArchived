// Vercel API route để proxy requests và tránh CORS
// Optimized for performance: faster timeout, better caching, edge runtime

// Use Edge Runtime for faster cold starts (no cold start delay)
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Accept-Language, User-Agent",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Chỉ cho phép GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response(JSON.stringify({ error: "URL parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Decode URL
    const targetUrl = decodeURIComponent(url);

    // Validate URL để đảm bảo an toàn
    if (!targetUrl.startsWith("https://www.nogizaka46.com/")) {
      return new Response(JSON.stringify({ error: "Invalid URL domain" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch từ target URL với timeout ngắn hơn (15s thay vì 30s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Target server returned ${response.status}` }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const data = await response.text();

    // Aggressive caching headers
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Accept-Language, User-Agent",
        "Access-Control-Allow-Credentials": "false",
        "Access-Control-Max-Age": "86400",
        // Aggressive caching: 10 phút (600s) thay vì 5 phút
        "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=300",
        // Add CDN caching headers
        "CDN-Cache-Control": "public, max-age=600",
        "Vercel-CDN-Cache-Control": "public, max-age=600",
      },
    });
  } catch (error) {
    const isTimeout = error.name === 'AbortError';

    return new Response(
      JSON.stringify({
        error: isTimeout ? "Request timeout" : "Internal server error",
        message: error.message,
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Accept-Language, User-Agent",
          "Access-Control-Allow-Credentials": "false",
          "Access-Control-Max-Age": "86400",
        },
      }
    );
  }
}
