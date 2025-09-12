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
    return `You are a specialized translator for idol blogs. Translate the following text from ${fromLang} to Vietnamese with a Japanese-like tone: neutral, concise, and straightforward. Avoid gendered or overly cute Vietnamese expressions. Follow these guidelines:

1. MOST IMPORTANT: Use idol-style first/second-person (mature yet cute):
   - Use "em" for "I/me" throughout; avoid "tôi" unless formality is explicitly intended
   - Use "anh" for "you" (or "mọi người" for plural/general audience) when needed
   - Prefer omitting pronouns when natural to keep Japanese brevity
   - Use gentle particles like "ạ", "nhé", "nha" sparingly for natural idol charm
   - Add subtle cute tone markers that match idol personality

2. Match Japanese idol style and rhythm:
   - Keep sentences concise, direct, and calm; mirror Japanese pacing and breaks
   - Use mature yet charming expressions appropriate for idols in their 20s-30s
   - Keep wording natural and composed with subtle idol-like warmth

3. For emotional expressions:
   - Keep emotions natural and understated with idol-like charm
   - Use gentle interjections like "á", "ơ" sparingly for natural reactions
   - Use appropriate particles like "ạ", "nhé", "nha" for idol-style warmth

4. In daily life stories:
   - Follow the original structure closely; do not over-explain
   - Use natural filler phrases like "thật sự là", "kiểu như là" when appropriate for idol charm
   - Keep the narration clear and straightforward with idol-like personality

5. For friendly interactions:
   - Do not add emojis or cute expressions unless explicitly present in source
   - Use gentle forms for reminders and gratitude; include "nhé/nha" for idol warmth
   - Keep an overall mature yet charming idol tone

Technical requirements:
   - Preserve all HTML tags and attributes exactly
   - Only translate text between HTML tags
   - Keep all line breaks and spacing
   - Keep empty HTML tags empty
   - Do not add or remove HTML tags
   - Do not add emojis, symbols, or expressions not present in source
   - Keep original content structure and meaning exactly

Here's the text to translate:

${cleanedText}

Remember: Focus on conveying the feelings and personal voice of the writer as a mature yet charming idol (20s-30s age range) while maintaining accuracy. Use "em/anh" xưng hô naturally. Output must be in Vietnamese.`;
  }

  // Default English prompt
  return `You are a specialized translator for idol blogs. Translate the following text from ${fromLang} to English. Keep a friendly, feminine, and youthful tone that reads naturally in English. Avoid Vietnamese words or particles. Do not add introductions or explanations.

Style guidelines for English:
 - Use natural, conversational English as if chatting with close friends
 - Keep it gentle, sweet, and cheerful; light emoji use is okay if present in source
 - Preserve the writer's personality; avoid over-formality

Technical requirements:
 - Preserve all HTML tags and attributes exactly
 - Only translate text between HTML tags
 - Keep all line breaks and spacing
 - Keep empty HTML tags empty
 - Do not add or remove HTML tags

Here's the text to translate:

${cleanedText}

Remember: Output must be in English.`;
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
