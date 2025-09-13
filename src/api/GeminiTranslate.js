import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/env";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const cleanTextForTranslation = (text) => {
  return text.replace(/\s+/g, " ").trim();
};

const cleanTranslationResult = (text) => {
  // Remove any potential Japanese text that might be included in translation
  // This is a safety measure to ensure only Vietnamese is returned
  return text
    .replace(/[ひらがなカタカナ一-龯]+/g, "") // Remove Japanese characters
    .replace(/\s+/g, " ")
    .trim();
};

const createTranslationPrompt = (text, fromLang, toLang) => {
  const cleanedText = cleanTextForTranslation(text);

  if (toLang.toLowerCase() === "vietnamese") {
    return `Translate from ${fromLang} to Vietnamese with Nogizaka46 idol blog style:

- Use "mình" for I/me when talking about self, "mọi người" for fans, never use "ạ" "nhé" 
- Use proper Vietnamese address terms for members: "cậu" (same age), "chị" (older), "em" (younger)
- Keep tone intimate, natural, gentle like an idol writing diary for fans
- Preserve HTML tags exactly, only translate text between tags
- Keep original content structure and emotional flow
- Maintain the diary-like, personal writing style
- Preserve nicknames and song titles exactly as they appear in original
- Keep focus on Nogizaka46 context and member relationships

Text to translate: ${cleanedText}

CRITICAL: Return ONLY the Vietnamese translation. Do NOT include the original Japanese text. Do NOT include any explanations, notes, or additional text. Just the pure Vietnamese translation.`;
  }

  // Default English prompt
  return `Translate from ${fromLang} to English with idol blog style:
- Keep tone friendly, feminine, and youthful
- Use natural conversational English
- Preserve HTML tags exactly, only translate text between tags
- Keep original personality and structure

Text: ${cleanedText}

Output ONLY the translated content in English. No explanations, no additional text.`;
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
