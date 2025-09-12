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

1. MOST IMPORTANT: Use friendly first/second-person:
   - Use "tớ" for "I/me" throughout; avoid "tôi" unless formality is explicitly intended
   - Use "cậu" for "you" (or "bạn" for plural/general audience) when needed
   - Prefer omitting pronouns when natural to keep Japanese brevity
   - Avoid particles like "ạ", "dạ", "nhé", "nha", "ạ nhỉ", "ạ nha"
   - Do not add cutesy tone markers or softeners not present in the source

2. Match Japanese style and rhythm:
   - Keep sentences concise, direct, and calm; mirror Japanese pacing and breaks
   - Avoid overly feminine style or teenage slang
   - Keep wording natural and composed; no added embellishments

3. For emotional expressions:
   - Keep emotions natural and understated
   - Avoid interjections/fillers like "á", "ơ", "ủa", "ơ kìa", and cutesy laughs like "hihi", "hehe"
   - Avoid particles/colloquialisms such as "ạ", "dạ", "vui quá à", "thích ghê", "nhé", "nha"

4. In daily life stories:
   - Follow the original structure closely; do not over-explain
   - Avoid filler phrases like "thật sự là", "kiểu như là" unless present in source
   - Keep the narration clear and straightforward

5. For friendly interactions:
   - Avoid emojis and cute expressions unless explicitly in the source
   - Use neutral forms for reminders and gratitude; avoid "nhé/nha" and similar softeners
   - Keep an overall neutral, courteous tone

Technical requirements:
   - Preserve all HTML tags and attributes exactly
   - Only translate text between HTML tags
   - Keep all line breaks and spacing
   - Keep empty HTML tags empty
   - Do not add or remove HTML tags

Here's the text to translate:

${cleanedText}

Remember: Focus on conveying the feelings and personal voice of the writer while maintaining accuracy. Output must be in Vietnamese.`;
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
