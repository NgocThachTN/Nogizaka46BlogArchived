import axios from "axios";
import { GEMINI_API_KEY } from "../config/env";

const createAxiosWithRetry = () => {
  const instance = axios.create({
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": GEMINI_API_KEY,
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
