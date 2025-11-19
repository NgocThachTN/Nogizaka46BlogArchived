import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEYS } from "../config/env";

// API key rotation state
let currentKeyIndex = 0;
let apiInstances = [];
let models = [];

// Initialize all API instances
const initializeApiInstances = () => {
  if (GEMINI_API_KEYS.length === 0) {
    console.warn("No API keys available for translation");
    return;
  }

  apiInstances = GEMINI_API_KEYS.map((key) => new GoogleGenerativeAI(key));
  models = apiInstances.map((genAI) =>
    genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  );

  console.log(
    `Initialized ${models.length} Gemini API instance(s) for translation`
  );
};

// Initialize on module load
initializeApiInstances();

// Get current model without rotating
const getCurrentModel = () => {
  if (models.length === 0) {
    throw new Error("No API keys configured for translation");
  }
  return models[currentKeyIndex];
};

// Rotate to next API key (call this when starting a new blog translation)
export const rotateToNextKey = () => {
  if (models.length === 0) {
    throw new Error("No API keys configured for translation");
  }

  const keyNumber = currentKeyIndex + 1;

  // Rotate to next key
  currentKeyIndex = (currentKeyIndex + 1) % models.length;

  if (models.length > 1) {
    console.log(
      `GeminiTranslate: Rotated to API key #${
        currentKeyIndex + 1
      } (was using #${keyNumber})`
    );
  }
};

const cleanTextForTranslation = (text) => {
  return text.replace(/\s+/g, " ").trim();
};

const cleanTranslationResult = (text) => {
  // Clean up translation result while preserving Vietnamese content
  let cleaned = text
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();

  // Step 1: Try to detect and split mixed Japanese-Vietnamese blocks
  // Look for pattern where Japanese appears before Vietnamese
  const blocks = cleaned.split(/\n{2,}/); // Split by double newlines (paragraph breaks)
  const vietnameseBlocks = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const processedLines = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (trimmed.length === 0) continue;

      // Remove lines with instruction keywords
      if (
        trimmed.includes("IMPORTANT INSTRUCTIONS") ||
        trimmed.includes("TRANSLATION RULES") ||
        trimmed.includes("CRITICAL RULES") ||
        trimmed.includes("Translate ONLY") ||
        trimmed.includes("Do NOT include") ||
        trimmed.includes("Do NOT add") ||
        trimmed.includes("Do NOT violate") ||
        trimmed.includes("Return ONLY") ||
        trimmed.includes("Text to translate") ||
        trimmed.includes("Title to translate") ||
        trimmed.includes("CRITICAL:") ||
        trimmed.includes("You are a professional translator") ||
        trimmed.includes("ブログ記事") ||
        trimmed.includes("Dịch từ tiếng Nhật") ||
        trimmed.includes("Văn bản cần dịch") ||
        trimmed.includes('Dùng "mình" cho I/me') ||
        trimmed.includes('Use "mình" for') ||
        trimmed.includes("Dùng cách xưng hô phù hợp") ||
        trimmed.includes("Giữ giọng văn thân mật") ||
        trimmed.includes("Giữ nguyên các thẻ HTML") ||
        trimmed.includes("Giữ nguyên cấu trúc") ||
        trimmed.includes("Duy trì văn phong") ||
        trimmed.includes("Ưu tiên ngữ cảnh")
      ) {
        continue;
      }

      // Check if line has HTML tags - preserve it
      const hasHtmlTags = /<[^>]+>/.test(trimmed);
      if (hasHtmlTags) {
        processedLines.push(line);
        continue;
      }

      // For non-HTML lines, check Japanese percentage
      const withoutSpaces = trimmed.replace(/\s+/g, "");
      const japaneseChars = withoutSpaces.match(
        /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g
      );
      const japaneseRatio = japaneseChars
        ? japaneseChars.length / withoutSpaces.length
        : 0;

      // If line is mostly Japanese (>50%), skip it entirely
      if (japaneseRatio > 0.5) {
        console.warn(
          "Filtering out Japanese line (>50%):",
          trimmed.substring(0, 50)
        );
        continue;
      }

      // If line has some Japanese (>10% but <50%), try to extract Vietnamese parts
      if (japaneseRatio > 0.1) {
        // Split by sentences and keep only Vietnamese ones
        const sentences = trimmed.split(/[。！？\n]/);
        const vietnameseSentences = sentences.filter((sent) => {
          const sentTrimmed = sent.trim();
          if (!sentTrimmed) return false;
          const sentWithoutSpaces = sentTrimmed.replace(/\s+/g, "");
          const sentJapChars = sentWithoutSpaces.match(
            /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g
          );
          const sentJapRatio = sentJapChars
            ? sentJapChars.length / sentWithoutSpaces.length
            : 0;
          return sentJapRatio < 0.3; // Keep if less than 30% Japanese
        });

        if (vietnameseSentences.length > 0) {
          processedLines.push(vietnameseSentences.join(" ").trim());
        }
      } else {
        // Line is mostly Vietnamese, keep it
        processedLines.push(line);
      }
    }

    if (processedLines.length > 0) {
      vietnameseBlocks.push(processedLines.join("\n"));
    }
  }

  return vietnameseBlocks.join("\n\n").trim();
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
  cleaned = cleaned.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
    ""
  );

  // Remove common decorative symbols (use alternation instead of character class)
  cleaned = cleaned.replace(/✨|💫|⭐|🎵|🎶|❤️|💕|💖|🌸|🌺|🌷|🎀/gu, "");

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
    return `You are a professional translator specializing in Japanese to Vietnamese translation for idol blog posts.

TASK: Translate ALL Japanese text below to Vietnamese. Your output must contain ZERO Japanese characters.

TRANSLATION STYLE GUIDE (Follow this tone exactly):
- Use "mình" for I/me (first person), "bọn mình" for we/us
- Use "mọi người" for fans/everyone
- Natural, conversational tone like talking to friends
- Express emotions genuinely: "Thật sự rất hạnh phúc", "Mình rất yêu", "Cảm ơn tất cả"
- NEVER use formal endings: "ạ", "nhé", "nha" , "á" , "nè" are FORBIDDEN
- Keep sentences simple and direct
- Use "!!" for excitement, "..." for thoughtfulness

TONE REFERENCE (match this style):
"Xin chào! Mình là... Mình thật sự, thật sự rất hạnh phúc. Cảm ơn tất cả mọi người luôn ủng hộ bọn mình!! Mình nghĩ... Mình muốn... Một lần nữa, cảm ơn..."

KEY RULES:
- Capitalize the first letter of each sentence (proper Vietnamese grammar)
- Natural flow: không formal, không cứng nhắc
- Emotional expressions: "thật sự", "rất", "nhiều", "lắm"
- End naturally without forced politeness

FORMATTING:
- Preserve ALL HTML tags exactly as they appear
- Keep original structure, spacing, and line breaks
- Translate text content only, keep all tags unchanged

🚫 ABSOLUTE PROHIBITIONS - VIOLATING THESE = FAILED TRANSLATION:
1. Do NOT include ANY Japanese characters (hiragana, katakana, kanji) in output
2. Do NOT write original Japanese text before/after/alongside Vietnamese translation
3. Do NOT create bilingual output (Japanese + Vietnamese)
4. Do NOT add icons, emojis, or symbols (🎵 ✨ 💫 ❤️ etc.)
5. Do NOT add explanatory notes or section headers
6. Do NOT use "ạ", "nhé", "nha" at sentence endings
7. Do NOT modify HTML structure

✅ SUCCESS CRITERIA:
1. Output contains ONLY Vietnamese text (and HTML tags if present in input)
2. Every single Japanese word is translated to Vietnamese
3. No Japanese characters appear anywhere in your response
4. Output reads naturally like idol's diary in Vietnamese
5. Tone matches the reference style: casual, warm, genuine

WARNING: If your output contains ANY Japanese characters, the translation is FAILED and REJECTED.

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

  // Use current model (no rotation, assumes title already rotated if needed)
  const keyNumber = currentKeyIndex + 1;
  console.log(
    `GeminiTranslate: Translating English body with API key #${keyNumber}`
  );

  // Get current model (same key for all chunks)
  const model = getCurrentModel();

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

  // Use current model (same key as title translation)
  const keyNumber = currentKeyIndex + 1;
  console.log(
    `GeminiTranslate: Translating body with API key #${keyNumber} (same as title)`
  );

  // Get current model (same key for all chunks and title)
  const model = getCurrentModel();

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isLastChunk = i === chunks.length - 1;
    let translation = "";
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const prompt = createTranslationPrompt(chunk, "Japanese", "Vietnamese");
        const result = await model.generateContent(prompt);
        const rawTranslation = result.response.text();
        translation = cleanTranslationResult(rawTranslation);

        // Final validation: Check if translation still contains significant Japanese
        const textWithoutHtml = translation.replace(/<[^>]+>/g, " ");
        const japaneseChars = textWithoutHtml.match(
          /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g
        );
        const japaneseRatio = japaneseChars
          ? japaneseChars.length / textWithoutHtml.length
          : 0;

        if (japaneseRatio > 0.15) {
          // More than 15% Japanese - this is a bad translation
          console.error(
            `WARNING: Translation contains ${(japaneseRatio * 100).toFixed(
              1
            )}% Japanese text!`
          );
          console.error(
            "Japanese chars found:",
            japaneseChars.length,
            "Total chars:",
            textWithoutHtml.length
          );
          console.error("Sample:", textWithoutHtml.substring(0, 200));

          if (retryCount < maxRetries) {
            retryCount++;
            console.warn(
              `Retrying translation (attempt ${retryCount + 1}/${
                maxRetries + 1
              })...`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
            continue;
          } else {
            console.error(
              "Max retries reached. Using best available translation despite Japanese content."
            );
          }
        }

        // Translation is good (< 15% Japanese), proceed
        break;
      } catch (error) {
        console.error("Translation error:", error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.warn(
            `Retrying after error (attempt ${retryCount + 1}/${
              maxRetries + 1
            })...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(
          "Failed to translate chunk after retries: " + error.message
        );
      }
    }

    if (onProgress) {
      onProgress(translation, isLastChunk);
    } else {
      translatedText += translation;
    }
  }

  return onProgress ? "" : translatedText;
}

export async function translateTitleToVietnamese(title) {
  console.log("translateTitleToVietnamese called");
  if (!title) return "";

  try {
    // Rotate to next key for this new blog translation
    rotateToNextKey();
    const keyNumber = currentKeyIndex + 1;
    console.log(
      `GeminiTranslate: Starting new blog translation with API key #${keyNumber} (title)`
    );
    const model = getCurrentModel();

    const prompt = `You are a professional translator specializing in Japanese to Vietnamese translation for idol blog titles.

Your task: Translate this Japanese title to Vietnamese. Return ONLY Vietnamese translation.

TRANSLATION STYLE:
- Use "mình" for I/me, "bọn mình" for we/us
- Natural, casual tone like talking to friends
- Never use "ạ", "nhé", "nha"
- Capitalize first letter of sentences (proper Vietnamese grammar)
- Preserve nicknames and song titles

TONE: Match this style - "Xin chào!", "Cảm ơn mọi người!!", "Hôm nay mình..."

CRITICAL - ABSOLUTELY FORBIDDEN:
❌ Do NOT include ANY Japanese text in your output
❌ Do NOT keep original Japanese alongside translation
❌ Do NOT add icons, emojis, or symbols (🎵 ✨ 💫 ❤️ etc.)
❌ Do NOT add extra text or explanations

✅ Return ONLY the Vietnamese translation (single line)
✅ Every Japanese word MUST be translated to Vietnamese
✅ Output must be 100% Vietnamese
✅ Casual, warm tone

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
