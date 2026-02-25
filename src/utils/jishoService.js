// Jisho dictionary service — tra từ và quản lý danh sách từ vựng đã lưu
// Lưu trữ từ vựng trong localStorage để dùng offline

const VOCAB_KEY = "nogizaka_vocab_v1";
const LOOKUP_CACHE = new Map(); // in-memory cache trong phiên

/** Regex kiểm tra có ký tự Nhật không */
export const isJapanese = (text) =>
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff65-\uff9f]/.test(text);

/**
 * Tra từ qua Jisho API (với cache)
 * @param {string} word - Từ cần tra
 * @returns {Promise<VocabEntry|null>}
 */
export async function lookupWord(word) {
  const key = word.trim();
  if (!key) return null;

  // Cache hit
  if (LOOKUP_CACHE.has(key)) return LOOKUP_CACHE.get(key);

  try {
    // Gọi qua proxy để tránh CORS (Jisho không set CORS headers đồng nhất trên mọi browser)
    const res = await fetch(
      `/api/jisho?word=${encodeURIComponent(key)}`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const data = json?.data;

    if (!data || data.length === 0) {
      LOOKUP_CACHE.set(key, null);
      return null;
    }

    const top = data[0];
    const japanese = top.japanese?.[0] ?? {};
    const senses = top.senses ?? [];

    /** @type {VocabEntry} */
    const entry = {
      word: japanese.word || key,
      reading: japanese.reading || "",
      // Tối đa 4 nghĩa đầu, mỗi nghĩa tối đa 4 từ
      definitions: senses.slice(0, 4).map((s) => ({
        en: (s.english_definitions || []).slice(0, 4).join(", "),
        pos: (s.parts_of_speech || []).join(", "),
        tags: s.tags || [],
      })),
      jlpt: top.jlpt?.[0] ?? null, // e.g. "jlpt-n3"
      isCommon: top.is_common ?? false,
      slug: top.slug ?? "",
    };

    LOOKUP_CACHE.set(key, entry);
    return entry;
  } catch (err) {
    console.error("[jishoService] lookupWord error:", err);
    return null;
  }
}

// ---------- localStorage helpers ----------

/** Lấy danh sách từ đã lưu từ localStorage */
export function getSavedVocab() {
  try {
    return JSON.parse(localStorage.getItem(VOCAB_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Lưu từ vào danh sách. Trả về true nếu lưu mới, false nếu đã tồn tại */
export function saveWord(entry) {
  const vocab = getSavedVocab();
  if (vocab.some((v) => v.word === entry.word)) return false;
  vocab.unshift({ ...entry, savedAt: Date.now() });
  localStorage.setItem(VOCAB_KEY, JSON.stringify(vocab));
  return true;
}

/** Xoá từ khỏi danh sách */
export function removeWord(word) {
  const vocab = getSavedVocab().filter((v) => v.word !== word);
  localStorage.setItem(VOCAB_KEY, JSON.stringify(vocab));
}

/** Xoá toàn bộ từ vựng đã lưu */
export function clearVocab() {
  localStorage.removeItem(VOCAB_KEY);
}

/** Tách các ký tự kanji ra khỏi một chuỗi */
export function extractKanji(text) {
  return [...text].filter((ch) => /[\u4e00-\u9fff]/.test(ch));
}

const KANJI_CACHE = new Map();

/**
 * Tra từng ký tự kanji qua Jisho #kanji tag
 * @param {string} char - 1 ký tự kanji
 * @returns {Promise<KanjiEntry|null>}
 */
export async function lookupKanji(char) {
  if (!char || !/[\u4e00-\u9fff]/.test(char)) return null;
  if (KANJI_CACHE.has(char)) return KANJI_CACHE.get(char);

  try {
    // Tìm thẳng bằng ký tự kanji — kết quả đầu thường là entry của chính kanji đó
    const res = await fetch(
      `/api/jisho?word=${encodeURIComponent(char)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json?.data;
    if (!data || data.length === 0) {
      KANJI_CACHE.set(char, null);
      return null;
    }

    // Ưu tiên entry có japanese[0].word === char (entry của chính kanji đó)
    const target = data.find((d) => d.japanese?.[0]?.word === char) ?? data[0];
    const japanese = target.japanese?.[0] ?? {};
    const senses = target.senses ?? [];

    // Lấy on'yomi / kun'yomi từ tất cả japanese entries (reading)
    const readings = [...new Set(
      (target.japanese || [])
        .map((j) => j.reading)
        .filter(Boolean)
    )].slice(0, 3);

    /** @type {KanjiEntry} */
    const entry = {
      kanji: japanese.word || char,
      reading: readings.join("・"),
      meanings: (senses[0]?.english_definitions || []).slice(0, 4),
      jlpt: target.jlpt?.[0] ?? null,
      isCommon: target.is_common ?? false,
    };

    KANJI_CACHE.set(char, entry);
    return entry;
  } catch (err) {
    console.error('[jishoService] lookupKanji error:', err);
    KANJI_CACHE.set(char, null);
    return null;
  }
}

/**
 * @typedef {Object} KanjiEntry
 * @property {string} kanji
 * @property {string} reading
 * @property {string[]} meanings
 * @property {string|null} jlpt
 * @property {boolean} isCommon
 */

/**
 * @typedef {Object} VocabEntry
 * @property {string} word
 * @property {string} reading  - hiragana/katakana reading
 * @property {{ en: string, pos: string, tags: string[] }[]} definitions
 * @property {string|null} jlpt  - "jlpt-n1"…"jlpt-n5"
 * @property {boolean} isCommon
 * @property {string} slug
 * @property {number} [savedAt]
 */
