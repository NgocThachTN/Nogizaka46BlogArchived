export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "Gemini API key is not set in environment variables. Translation features will not work."
  );
}
