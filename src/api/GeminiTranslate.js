import { geminiServices } from "./GeminiServices";

// Hàm để làm sạch text trước khi dịch
const cleanTextForTranslation = (text) => {
  // Chỉ xóa các markdown code block markers và trim whitespace
  return text
    .replace(/^```html\s*|\s*```$/gm, "") // Chỉ xóa ```html ở đầu và ``` ở cuối
    .replace(/^\s+|\s+$/g, ""); // Trim whitespace
};

// Hàm để tạo prompt cho việc dịch
const createTranslationPrompt = (text, fromLang, toLang) => {
  const cleanedText = cleanTextForTranslation(text);
  return `You are a professional translator. Please translate the following text from ${fromLang} to ${toLang}. Follow these rules strictly:
1. Preserve all HTML tags and their attributes exactly as they are
2. Only translate the text content between HTML tags
3. Maintain the original meaning and context
4. Keep all line breaks and spacing
5. Do not add or remove any HTML tags
6. If you see empty HTML tags like <p></p>, keep them empty

Here's the text to translate:

${cleanedText}

Translation:`;
};

// Hàm để chia nhỏ text thành các phần
const splitTextIntoChunks = (text, maxLength = 5000) => {
  // Làm sạch text trước khi chia
  const cleanedText = cleanTextForTranslation(text);

  // Tách text thành các câu và giữ nguyên cấu trúc HTML
  const segments = cleanedText.split(
    /(?=<\/?(?:p|div|h[1-6]|br|img|a)[^>]*>)|(?<=<\/(?:p|div|h[1-6]|br|img|a)>)|(?<=[.!?。！？]\s+)/
  );

  const chunks = [];
  let currentChunk = "";
  let currentLength = 0;

  for (const segment of segments) {
    const segmentLength = segment.trim().length;

    // Nếu segment quá dài, chia nhỏ nó theo khoảng trắng
    if (segmentLength > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
        currentLength = 0;
      }

      // Chia segment dài thành các phần nhỏ hơn theo khoảng trắng
      const words = segment.split(/(\s+)/);
      let tempChunk = "";

      for (const word of words) {
        if ((tempChunk + word).length > maxLength) {
          if (tempChunk) chunks.push(tempChunk);
          tempChunk = word;
        } else {
          tempChunk += word;
        }
      }

      if (tempChunk) {
        currentChunk = tempChunk;
        currentLength = tempChunk.length;
      }
      continue;
    }

    // Kiểm tra nếu thêm segment mới sẽ vượt quá maxLength
    if (currentLength + segmentLength > maxLength) {
      chunks.push(currentChunk);
      currentChunk = segment;
      currentLength = segmentLength;
    } else {
      currentChunk += segment;
      currentLength += segmentLength;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
};

// Hàm chính để thực hiện dịch
export const translateText = async (text, fromLang, toLang, onProgress) => {
  try {
    // Kiểm tra và xử lý text rỗng
    if (!text) {
      console.warn("Received null or undefined text for translation");
      return "";
    }

    const trimmedText = text.trim();
    if (trimmedText === "") {
      console.warn("Received empty text for translation");
      return text; // Return original to preserve whitespace
    }

    // Kiểm tra nếu chỉ có HTML tags rỗng
    const onlyEmptyTags = trimmedText.replace(/<[^>]*>/g, "").trim() === "";
    if (onlyEmptyTags) {
      console.warn("Text contains only empty HTML tags, returning as is");
      return text; // Return original to preserve structure
    }

    console.log("Bắt đầu dịch văn bản:", {
      độ_dài: text.length,
      từ_ngôn_ngữ: fromLang,
      sang_ngôn_ngữ: toLang,
    });

    // Chia nhỏ text thành các phần
    const chunks = splitTextIntoChunks(text);
    console.log(
      `Đã chia thành ${chunks.length} phần nhỏ (mỗi phần tối đa 5000 ký tự)`
    );

    // Log kích thước của từng phần để kiểm tra
    chunks.forEach((chunk, index) => {
      console.log(`Phần ${index + 1}/${chunks.length}: ${chunk.length} ký tự`);
    });

    // Process chunks sequentially to avoid rate limiting
    const batchSize = 1; // Reduced to 1 to avoid concurrent requests
    const translatedChunks = new Array(chunks.length);

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchIndexes = Array.from(
        { length: batch.length },
        (_, idx) => i + idx
      );

      console.log(
        `Đang dịch phần ${i + 1}/${chunks.length} (${batch[0].length} ký tự)`
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

      // Add longer delay between requests to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.log("Translation successful");
    return translatedChunks.join("");
  } catch (error) {
    console.error("Translation error:", error);

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"] || 30;
      console.warn(
        `Rate limit hit. Waiting ${retryAfter} seconds before retrying...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      // Retry the current chunk
      return translateText(text, fromLang, toLang, onProgress);
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
