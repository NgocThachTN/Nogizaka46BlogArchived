import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/env";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const cleanTextForTranslation = (text) => {
  return text.replace(/\s+/g, " ").trim();
};

const createTranslationPrompt = (text, fromLang, toLang) => {
  const cleanedText = cleanTextForTranslation(text);

  if (toLang.toLowerCase() === "vietnamese") {
    return `Translate from ${fromLang} to Vietnamese with Japanese idol blog style:

- Use "em" for I/me, "anh or mọi người" for you (idol speaking to fans)
- NEVER use Vietnamese casual style: "tớ/cậu", "ạ", "á", "nè", "nhé", "nha"
- Keep tone mature yet charming (20s-30s Japanese idol style)
- Avoid Vietnamese particles and interjections
- Preserve HTML tags exactly, only translate text between tags
- Keep sentences concise and natural like Japanese style

Text: ${cleanedText}

Output ONLY the translated content in Vietnamese. No explanations, no additional text.`;
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
      const translation = result.response.text();

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
      const translation = result.response.text();

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
