/**
 * GoogleTranslate.js
 * Dùng Google Translate free endpoint (client=gtx) — không cần API key, không tốn quota.
 */

/**
 * Dịch nghĩa từ vựng sang tiếng Việt.
 * @param {string} _word    - Từ tiếng Nhật (unused, kept for API compat)
 * @param {string} _reading - Cách đọc (unused, kept for API compat)
 * @param {Array<{en:string}>} enDefs - Các nghĩa tiếng Anh từ Jisho
 * @returns {Promise<string[]>} Danh sách nghĩa tiếng Việt
 */
export async function translateVocabToVi(_word, _reading, enDefs) {
  if (!enDefs?.length) return [];

  const texts = enDefs
    .slice(0, 3)
    .map((d) => (d.en || d).toString().trim())
    .filter(Boolean);
  if (!texts.length) return [];

  // Dịch từng nghĩa song song qua Google Translate (client=gtx = free, no key)
  const gtUrl = (text) =>
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const results = await Promise.all(
      texts.map((text) =>
        fetch(gtUrl(text))
          .then((r) => r.json())
          .then((data) => {
            // Response shape: [ [ ["translated","original",...], ... ], ... ]
            const segments = data?.[0];
            if (!Array.isArray(segments)) return text;
            return segments.map((s) => s?.[0] ?? "").join("").trim() || text;
          })
          .catch(() => text)
      )
    );
    return results.filter(Boolean);
  } catch (err) {
    console.error("[translateVocabToVi] error:", err);
    return [];
  }
}

/**
 * Dịch một đoạn văn bản bất kỳ sang ngôn ngữ chỉ định.
 * @param {string} text      - Văn bản nguồn
 * @param {string} sourceLang - Ngôn ngữ nguồn (mặc định "ja")
 * @param {string} targetLang - Ngôn ngữ đích (mặc định "vi")
 * @returns {Promise<string>}
 */
export async function googleTranslate(text, sourceLang = "ja", targetLang = "vi") {
  if (!text?.trim()) return "";

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text.trim())}`;

  try {
    const data = await fetch(url).then((r) => r.json());
    const segments = data?.[0];
    if (!Array.isArray(segments)) return text;
    return segments.map((s) => s?.[0] ?? "").join("").trim() || text;
  } catch (err) {
    console.error("[googleTranslate] error:", err);
    return "";
  }
}
