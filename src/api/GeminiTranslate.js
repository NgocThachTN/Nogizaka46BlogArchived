import { geminiServices } from "./GeminiServices";

// Hàm để làm sạch text trước khi dịch
const cleanTextForTranslation = (text) => {
  return text
    .replace(/```html/g, "") // Xóa ```html
    .replace(/```/g, "") // Xóa các ``` còn lại
    .replace(/^\s+|\s+$/g, ""); // Trim whitespace
};

// Hàm để tạo prompt cho việc dịch
const createTranslationPrompt = (text, fromLang, toLang) => {
  const cleanedText = cleanTextForTranslation(text);
  return `You are a professional translator. Translate the following text from ${fromLang} to ${toLang}. Keep all HTML tags intact and only translate the text content. Maintain the original meaning and context:

${cleanedText}

Translation:`;
};

// Hàm để chia nhỏ text thành các phần
const splitTextIntoChunks = (text, maxLength = 2000) => {
  // Làm sạch text trước khi chia
  const cleanedText = cleanTextForTranslation(text);
  // Tách text thành các đoạn theo thẻ HTML và đoạn văn
  const segments = cleanedText.split(
    /(?=<\/?(?:p|div|h[1-6]|br|img|a)[^>]*>)|(?<=<\/(?:p|div|h[1-6]|br|img|a)>)/
  );

  const chunks = [];
  let currentChunk = "";

  for (const segment of segments) {
    if (currentChunk.length + segment.length > maxLength) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = segment;
    } else {
      currentChunk += segment;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};

// Hàm chính để thực hiện dịch
export const translateText = async (text, fromLang, toLang, onProgress) => {
  try {
    if (!text || text.trim() === "") {
      return "";
    }

    console.log("Translating text:", {
      length: text.length,
      from: fromLang,
      to: toLang,
    });

    // Chia nhỏ text thành các phần
    const chunks = splitTextIntoChunks(text);
    console.log(`Split into ${chunks.length} chunks`);

    // Dịch song song nhiều phần
    const batchSize = 3; // Số phần dịch cùng lúc
    const translatedChunks = new Array(chunks.length);

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchIndexes = Array.from(
        { length: batch.length },
        (_, idx) => i + idx
      );

      console.log(
        `Translating chunks ${i + 1} to ${i + batch.length}/${chunks.length}`
      );

      const batchPromises = batch.map((chunk, batchIdx) => {
        const config = {
          url: "/models/gemini-2.0-flash:generateContent",
          method: "post",
          retry: 3,
          retryDelay: 2000,
          data: {
            contents: [
              {
                parts: [
                  {
                    text: createTranslationPrompt(chunk, fromLang, toLang),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topK: 1,
              topP: 1,
              maxOutputTokens: 2048,
            },
          },
        };

        return geminiServices(config).then((response) => {
          if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error(
              `Không nhận được kết quả dịch từ API cho phần ${i + batchIdx + 1}`
            );
          }
          return {
            index: batchIndexes[batchIdx],
            text: response.data.candidates[0].content.parts[0].text.trim(),
          };
        });
      });

      try {
        // Đợi tất cả các request trong batch hoàn thành
        const results = await Promise.all(batchPromises);

        // Xử lý kết quả theo thứ tự
        for (const result of results) {
          const cleanedText = result.text.replace(/^Translation:\s*/i, "");
          translatedChunks[result.index] = cleanedText;

          // Gọi callback để cập nhật tiến trình
          if (onProgress) {
            const isLast = result.index === chunks.length - 1;
            onProgress(cleanedText, isLast);
          }
        }
      } catch (error) {
        console.error(`Error in batch ${i + 1}-${i + batch.length}:`, error);
        throw error;
      }

      // Đợi một chút giữa các batch để tránh rate limit
      if (i + batchSize < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("Translation successful");
    return translatedChunks.join("");
  } catch (error) {
    console.error("Translation error:", error);

    if (error.response?.status === 429) {
      throw new Error("Đã vượt quá giới hạn API. Vui lòng thử lại sau.");
    }

    if (error.response?.data?.error?.message) {
      throw new Error(
        `Lỗi từ Gemini API: ${error.response.data.error.message}`
      );
    }

    throw new Error(`Lỗi dịch: ${error.message}`);
  }
};

// Các hàm tiện ích cho các cặp ngôn ngữ cụ thể
export const translateJapaneseToEnglish = async (text, onProgress) => {
  return translateText(text, "Japanese", "English", onProgress);
};

export const translateJapaneseToVietnamese = async (text, onProgress) => {
  return translateText(text, "Japanese", "Vietnamese", onProgress);
};

export const translateEnglishToJapanese = async (text, onProgress) => {
  return translateText(text, "English", "Japanese", onProgress);
};

export const translateEnglishToVietnamese = async (text, onProgress) => {
  return translateText(text, "English", "Vietnamese", onProgress);
};

export const translateVietnameseToJapanese = async (text, onProgress) => {
  return translateText(text, "Vietnamese", "Japanese", onProgress);
};

export const translateVietnameseToEnglish = async (text, onProgress) => {
  return translateText(text, "Vietnamese", "English", onProgress);
};
