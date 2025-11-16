import axios from "axios";
import { GEMINI_API_KEYS } from "../config/env";

// API key rotation state for axios instances
let currentAxiosKeyIndex = 0;

const createAxiosWithRetry = () => {
  // Get current API key and rotate
  const getCurrentApiKey = () => {
    if (GEMINI_API_KEYS.length === 0) {
      throw new Error("No API keys configured");
    }
    const key = GEMINI_API_KEYS[currentAxiosKeyIndex];
    currentAxiosKeyIndex = (currentAxiosKeyIndex + 1) % GEMINI_API_KEYS.length;

    if (GEMINI_API_KEYS.length > 1) {
      console.log(`GeminiServices: Using API key #${currentAxiosKeyIndex + 1}`);
    }

    return key;
  };

  const instance = axios.create({
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": getCurrentApiKey(),
    },
    timeout: 120000, // 2 minutes timeout
  });

  // Add retry interceptor
  instance.interceptors.response.use(undefined, async (err) => {
    const { config } = err;
    if (!config || !config.retry) {
      return Promise.reject(err);
    }

    config.retryCount = config.retryCount || 0;
    if (config.retryCount >= config.retry) {
      return Promise.reject(err);
    }

    config.retryCount += 1;
    const delayRetry = new Promise((resolve) =>
      setTimeout(resolve, config.retryDelay || 2000)
    );
    await delayRetry;
    return instance(config);
  });

  return instance;
};

export const geminiServices = createAxiosWithRetry();
