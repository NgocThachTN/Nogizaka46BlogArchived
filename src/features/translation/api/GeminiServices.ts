import axios from "axios";
import { GEMINI_API_KEYS } from "../../../lib/config/env";

// API key rotation state for axios instances
let currentAxiosKeyIndex = 0;

const createAxiosWithRetry = () => {
  const instance = axios.create({
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 120000, // 2 minutes timeout
  });

  // Add request interceptor to rotate API keys for each request
  instance.interceptors.request.use((config) => {
    if (GEMINI_API_KEYS.length === 0) {
      throw new Error("No API keys configured");
    }
    
    // Get current key and log BEFORE rotating
    const key = GEMINI_API_KEYS[currentAxiosKeyIndex];
    const keyNumber = currentAxiosKeyIndex + 1; // Human-readable key number (1-based)
    
    // Rotate to next key for next request
    currentAxiosKeyIndex = (currentAxiosKeyIndex + 1) % GEMINI_API_KEYS.length;

    // Set API key in header for this request
    config.headers["X-goog-api-key"] = key;

    if (GEMINI_API_KEYS.length > 1) {
      console.log(`GeminiServices: Using API key #${keyNumber} (will use #${currentAxiosKeyIndex + 1} next)`);
    }

    return config;
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
