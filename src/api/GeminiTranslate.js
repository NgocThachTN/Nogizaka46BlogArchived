import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/env";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const cleanTextForTranslation = (text) => {
  return text.replace(/\s+/g, " ").trim();
};

const createTranslationPrompt = (text, fromLang, toLang) => {
  const cleanedText = cleanTextForTranslation(text);
  return `You are a specialized translator for idol blogs, focusing on casual, friendly, and feminine writing styles. Please translate the following text from ${fromLang} to ${toLang} while following these guidelines:

1. MOST IMPORTANT: Use casual first-person pronouns in Vietnamese:
   - Use "tớ/mình" instead of "tôi" for "I/me"
   - Use "cậu/bạn" instead of "bạn/các bạn" for "you"
   - Keep the tone friendly and intimate like talking to close friends

2. Maintain a youthful, feminine voice throughout:
   - Write like a young woman sharing with friends
   - Use gentle, sweet expressions common among young women
   - Keep the innocent and cheerful personality
   - Mix in cute expressions naturally

3. For emotional expressions:
   - Show excitement with "á", "ơ", "ủa" instead of formal expressions
   - Use "hihi", "hehe" for light-hearted moments
   - Express surprise with "ơ kìa", "ủa" rather than formal phrases
   - Show happiness with expressions like "vui quá à", "thích ghê"

4. In daily life stories:
   - Write as if chatting with close friends
   - Use casual phrases like "thật sự là", "kiểu như là"
   - Share feelings openly and naturally
   - Keep the writing style sweet and endearing

5. For friendly interactions:
   - Use heart emojis and cute expressions where appropriate
   - Show care with phrases like "nhớ nhé", "nha"
   - Express gratitude casually like "cảm ơn nha", "cảm ơn nhiều nha"
   - Keep the overall tone warm and intimate
7. Technical requirements:
   - Preserve all HTML tags and attributes exactly
   - Only translate text between HTML tags
   - Keep all line breaks and spacing
   - Keep empty HTML tags empty
   - Do not add or remove HTML tags

Here's the text to translate:

${cleanedText}

Remember: Focus on conveying the feelings and personal voice of the writer while maintaining accuracy.`;
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
