import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/env";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const cleanTextForTranslation = (text) => {
  return text.replace(/\s+/g, " ").trim();
};

const cleanTranslationResult = (text) => {
  // Clean up translation result while preserving Vietnamese content
  let cleaned = text
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();

  // Remove any instruction text that might be included
  const lines = cleaned.split("\n").filter((line) => {
    const trimmed = line.trim();
    // Remove lines that contain instruction keywords
    return (
      !trimmed.includes("IMPORTANT INSTRUCTIONS") &&
      !trimmed.includes("TRANSLATION RULES") &&
      !trimmed.includes("CRITICAL RULES") &&
      !trimmed.includes("Translate ONLY") &&
      !trimmed.includes("Do NOT include") &&
      !trimmed.includes("Do NOT add") &&
      !trimmed.includes("Do NOT violate") &&
      !trimmed.includes("Return ONLY") &&
      !trimmed.includes("Text to translate") &&
      !trimmed.includes("Title to translate") &&
      !trimmed.includes("CRITICAL:") &&
      !trimmed.includes("You are a professional translator") &&
      !trimmed.includes("ブログ記事") &&
      !trimmed.includes("Dịch từ tiếng Nhật") &&
      !trimmed.includes("Văn bản cần dịch") &&
      !trimmed.includes('Dùng "mình" cho I/me') &&
      !trimmed.includes('Use "mình" for') &&
      !trimmed.includes("Dùng cách xưng hô phù hợp") &&
      !trimmed.includes("Giữ giọng văn thân mật") &&
      !trimmed.includes("Giữ nguyên các thẻ HTML") &&
      !trimmed.includes("Giữ nguyên cấu trúc") &&
      !trimmed.includes("Duy trì văn phong") &&
      !trimmed.includes("Ưu tiên ngữ cảnh") &&
      trimmed.length > 0
    );
  });

  return lines.join("\n").trim();
};

const cleanTitleTranslation = (text) => {
  // Special cleaning for title translations
  let cleaned = text
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Remove instruction text
  const lines = cleaned.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      !trimmed.includes("IMPORTANT INSTRUCTIONS") &&
      !trimmed.includes("TRANSLATION RULES") &&
      !trimmed.includes("CRITICAL RULES") &&
      !trimmed.includes("Translate ONLY") &&
      !trimmed.includes("Do NOT include") &&
      !trimmed.includes("Do NOT add") &&
      !trimmed.includes("Do NOT violate") &&
      !trimmed.includes("Return ONLY") &&
      !trimmed.includes("Title to translate") &&
      !trimmed.includes("Text to translate") &&
      !trimmed.includes("CRITICAL:") &&
      !trimmed.includes("You are a professional translator") &&
      !trimmed.includes("ブログ記事") &&
      !trimmed.includes("Dịch từ tiếng Nhật") &&
      !trimmed.includes("Văn bản cần dịch") &&
      !trimmed.includes('Dùng "mình" cho I/me') &&
      !trimmed.includes('Use "mình" for') &&
      !trimmed.includes("Dùng cách xưng hô phù hợp") &&
      !trimmed.includes("Giữ giọng văn thân mật") &&
      !trimmed.includes("Giữ nguyên các thẻ HTML") &&
      !trimmed.includes("Giữ nguyên cấu trúc") &&
      !trimmed.includes("Duy trì văn phong") &&
      !trimmed.includes("Ưu tiên ngữ cảnh") &&
      trimmed.length > 0
    );
  });

  cleaned = lines.join("\n").trim();

  // Remove any emojis or icons that Gemini might add
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  // Remove common decorative symbols (use alternation instead of character class)
  cleaned = cleaned.replace(/✨|💫|⭐|🎵|🎶|❤️|💕|💖|🌸|🌺|🌷|🎀/gu, '');

  // If the text contains both Japanese and Vietnamese, try to extract only Vietnamese
  // Look for patterns like "Japanese text Vietnamese text" and keep only Vietnamese
  const finalLines = cleaned.split("\n").filter((line) => line.trim());
  if (finalLines.length > 1) {
    // If multiple lines, take the last non-empty line (likely Vietnamese)
    cleaned = finalLines[finalLines.length - 1].trim();
  }

  return cleaned;
};

const createTranslationPrompt = (text, fromLang, toLang) => {
  const cleanedText = cleanTextForTranslation(text);

  if (toLang.toLowerCase() === "vietnamese") {
    return `You are a professional translator. Translate the following ${fromLang} text to Vietnamese.

TRANSLATION RULES:
1. Use "mình" for I/me (first person), "mọi người" for fans/everyone
2. Use proper Vietnamese address: "cậu" (same age), "chị" (older), "em" (younger)
3. Keep intimate, natural tone like idol diary
4. NEVER use "ạ", "nhé" at end of sentences
5. Preserve ALL HTML tags exactly as they appear
6. Keep original structure, spacing, and formatting
7. Translate text content only, keep all tags unchanged
8. Maintain emotional tone and personality

CRITICAL RULES - DO NOT VIOLATE:
- Do NOT add any icons, emojis, or symbols (🎵 ✨ 💫 ❤️ etc.)
- Do NOT add any decorative elements
- Do NOT add any extra text or explanations
- Do NOT include the original Japanese text
- Do NOT add section headers or labels
- Do NOT modify HTML structure
- Return ONLY the translated Vietnamese text with preserved HTML tags

Text to translate:
${cleanedText}`;
  }

  // Default English prompt
  return `You are a professional translator. Translate the following ${fromLang} text to English.

TRANSLATION RULES:
1. Keep tone friendly, feminine, and youthful
2. Use natural conversational English
3. Preserve ALL HTML tags exactly as they appear
4. Keep original structure and formatting

CRITICAL RULES - DO NOT VIOLATE:
- Do NOT add any icons, emojis, or symbols
- Do NOT add any extra text or explanations
- Do NOT include the original Japanese text
- Do NOT modify HTML structure
- Return ONLY the translated English text with preserved HTML tags

Text to translate:
${cleanedText}`;
};

const splitTextIntoChunks = (text, maxChunkSize = 4000) => {
  const chunks = [];
  let currentChunk = "";
  let tagStack = [];
  let currentSize = 0;

  const lines = text.split("\n");

  for (const line of lines) {
    // Calculate size including newline
    const lineSize = line.length + 1;

    // If adding this line would exceed maxChunkSize, save current chunk
    if (currentSize + lineSize > maxChunkSize && currentChunk) {
      // Close any open tags
      const closingTags = tagStack.reverse().join("");
      chunks.push(currentChunk + closingTags);

      // Start new chunk with opening tags
      currentChunk = tagStack.reverse().join("");
      currentSize = currentChunk.length;
    }

    // Track HTML tags
    const openTags = line.match(/<[^/][^>]*>/g) || [];
    const closeTags = line.match(/<\/[^>]+>/g) || [];

    tagStack.push(...openTags);
    for (const closeTag of closeTags) {
      const tagName = closeTag.match(/<\/([^>]+)>/)[1];
      const index = tagStack
        .reverse()
        .findIndex((tag) => tag.match(new RegExp(`<${tagName}[^>]*>`)));
      if (index !== -1) {
        tagStack.splice(tagStack.length - 1 - index, 1);
      }
      tagStack.reverse();
    }

    currentChunk += line + "\n";
    currentSize += lineSize;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export async function translateJapaneseToEnglish(text, onProgress) {
  console.log("translateJapaneseToEnglish called");
  if (!text) return "";

  const chunks = splitTextIntoChunks(text);
  let translatedText = "";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLastChunk = i === chunks.length - 1;

    try {
      const prompt = createTranslationPrompt(chunk, "Japanese", "English");
      const result = await model.generateContent(prompt);
      const rawTranslation = result.response.text();
      const translation = cleanTranslationResult(rawTranslation);

      if (onProgress) {
        onProgress(translation, isLastChunk);
      } else {
        translatedText += translation;
      }
    } catch (error) {
      console.error("Translation error:", error);
      throw new Error("Failed to translate chunk: " + error.message);
    }
  }

  return onProgress ? "" : translatedText;
}

export async function translateJapaneseToVietnamese(text, onProgress) {
  console.log("translateJapaneseToVietnamese called");
  if (!text) return "";

  const chunks = splitTextIntoChunks(text);
  let translatedText = "";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLastChunk = i === chunks.length - 1;

    try {
      const prompt = createTranslationPrompt(chunk, "Japanese", "Vietnamese");
      const result = await model.generateContent(prompt);
      const rawTranslation = result.response.text();
      const translation = cleanTranslationResult(rawTranslation);

      if (onProgress) {
        onProgress(translation, isLastChunk);
      } else {
        translatedText += translation;
      }
    } catch (error) {
      console.error("Translation error:", error);
      throw new Error("Failed to translate chunk: " + error.message);
    }
  }

  return onProgress ? "" : translatedText;
}

export async function translateTitleToVietnamese(title) {
  console.log("translateTitleToVietnamese called");
  if (!title) return "";

  try {
    const prompt = `You are a professional translator. Translate this Japanese title to Vietnamese.

TRANSLATION RULES:
- Use "mình" for I/me, "mọi người" for fans
- Keep intimate, natural tone like idol diary
- Never use "ạ", "nhé"
- Preserve nicknames and song titles exactly

CRITICAL RULES - DO NOT VIOLATE:
- Do NOT add any icons, emojis, or symbols (🎵 ✨ 💫 ❤️ etc.)
- Do NOT add any extra text or explanations
- Do NOT include the original Japanese text
- Return ONLY the Vietnamese translation of the title

Title to translate: ${title}`;

    const result = await model.generateContent(prompt);
    const rawTranslation = result.response.text();
    const translation = cleanTitleTranslation(rawTranslation);

    return translation;
  } catch (error) {
    console.error("Title translation error:", error);
    throw new Error("Failed to translate title: " + error.message);
  }
}
