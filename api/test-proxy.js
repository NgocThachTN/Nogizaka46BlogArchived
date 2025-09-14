// Test endpoint để kiểm tra proxy service
export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, Accept-Language, User-Agent"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Test proxy service
    const proxyUrl =
      "/api/proxy?url=" +
      encodeURIComponent(
        "https://www.nogizaka46.com/s/n46/api/list/member?callback=res"
      );

    console.log("Test proxy URL:", proxyUrl);

    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });

    console.log("Test proxy response status:", response.status);
    console.log("Test proxy response ok:", response.ok);
    console.log(
      "Test proxy response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.ok) {
      const data = await response.text();
      console.log("Test proxy data length:", data.length);
      console.log("Test proxy data preview:", data.substring(0, 300));

      // Try to parse the data
      try {
        const jsonStr = data.replace(/^res\(/, "").replace(/\);?$/, "");
        const api = JSON.parse(jsonStr);
        console.log(
          "Test proxy - parsed API data length:",
          api.data?.length || 0
        );
        console.log(
          "Test proxy - sample members:",
          api.data?.slice(0, 3).map((m) => ({ code: m.code, name: m.name })) ||
            []
        );

        // Set CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, Accept, Accept-Language, User-Agent"
        );
        res.setHeader("Access-Control-Allow-Credentials", "false");
        res.setHeader("Access-Control-Max-Age", "86400");
        res.setHeader("Content-Type", "application/json; charset=utf-8");

        return res.status(200).json({
          success: true,
          dataLength: data.length,
          apiDataLength: api.data?.length || 0,
          sampleMembers:
            api.data
              ?.slice(0, 3)
              .map((m) => ({ code: m.code, name: m.name })) || [],
          dataPreview: data.substring(0, 300),
        });
      } catch (parseError) {
        console.warn("Test proxy - data parsing failed:", parseError);

        // Set CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, Accept, Accept-Language, User-Agent"
        );
        res.setHeader("Access-Control-Allow-Credentials", "false");
        res.setHeader("Access-Control-Max-Age", "86400");
        res.setHeader("Content-Type", "application/json; charset=utf-8");

        return res.status(200).json({
          success: false,
          error: "Data parsing failed",
          dataLength: data.length,
          dataPreview: data.substring(0, 300),
          parseError: parseError.message,
        });
      }
    } else {
      console.log("Test proxy failed - response not ok:", response.status);

      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Accept, Accept-Language, User-Agent"
      );
      res.setHeader("Access-Control-Allow-Credentials", "false");
      res.setHeader("Access-Control-Max-Age", "86400");
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      return res.status(200).json({
        success: false,
        error: `Response not ok: ${response.status}`,
        status: response.status,
      });
    }
  } catch (error) {
    console.warn("Test proxy call failed with error:", error);

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, Accept-Language, User-Agent"
    );
    res.setHeader("Access-Control-Allow-Credentials", "false");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    return res.status(200).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
