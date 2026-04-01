// Support multiple API keys for load balancing
const API_KEY_1 = import.meta.env.VITE_GEMINI_API_KEY;
const API_KEY_2 = import.meta.env.VITE_GEMINI_API_KEY_2;

// Export all available API keys
export const GEMINI_API_KEYS = [API_KEY_1, API_KEY_2].filter(key => key && key.trim() !== '');

// Export primary key for backward compatibility
export const GEMINI_API_KEY = API_KEY_1;

if (GEMINI_API_KEYS.length === 0) {
  console.warn(
    "No Gemini API keys are set in environment variables. Translation features will not work."
  );
} else {
  console.log(`Loaded ${GEMINI_API_KEYS.length} Gemini API key(s)`);
}
