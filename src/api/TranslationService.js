import axios from "axios";
import { GEMINI_API_KEY } from "../config/env";

const translationApi = axios.create({
  baseURL: "/translate/language/translate/v2",
  params: {
    key: GEMINI_API_KEY,
  },
});

export const translateText = async (text, targetLang, sourceLang = "ja") => {
  try {
    if (!text || text.trim() === "") {
      return "";
    }

    console.log("Translating text:", {
      length: text.length,
      from: sourceLang,
      to: targetLang,
    });

    const response = await translationApi.post("", {
      q: text,
      target: targetLang,
      source: sourceLang,
      format: "html",
    });

    if (!response.data?.data?.translations?.[0]?.translatedText) {
      throw new Error("Không nhận được kết quả dịch từ API");
    }

    console.log("Translation successful");
    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    if (error.response?.status === 403) {
      throw new Error("API key không hợp lệ hoặc đã hết hạn");
    }
    throw new Error(`Lỗi dịch: ${error.message}`);
  }
};

// Các hàm tiện ích
export const translateJapaneseToVietnamese = async (text) => {
  return translateText(text, "vi");
};

export const translateJapaneseToEnglish = async (text) => {
  return translateText(text, "en");
};

export const translateEnglishToJapanese = async (text) => {
  return translateText(text, "ja");
};

export const translateEnglishToVietnamese = async (text) => {
  return translateText(text, "vi");
};

export const translateVietnameseToJapanese = async (text) => {
  return translateText(text, "ja");
};

export const translateVietnameseToEnglish = async (text) => {
  return translateText(text, "en");
};
