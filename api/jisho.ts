// Vercel Edge function — proxy Jisho dictionary API to avoid client-side CORS
export const config = { runtime: "edge" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const { searchParams } = new URL(req.url);
  const word = searchParams.get("word");

  if (!word || !word.trim()) {
    return new Response(JSON.stringify({ error: "word param required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word.trim())}`;

    const response = await fetch(jishoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NogizakaBlogReader/1.0; +https://nogizaka46blog.vercel.app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Jisho returned ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400", // 24h cache — dictionary doesn't change
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[jisho proxy] error:", err.message);
    return new Response(JSON.stringify({ error: err.message, data: [] }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
