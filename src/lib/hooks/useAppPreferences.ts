import { useEffect, useState } from "react";
import { useStoredState } from "./useStoredState";
import type { LanguageCode, ThemeMode } from "../../shared/types";

const getDefaultThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  return prefersDark ? "dark" : "light";
};

export function useAppPreferences(initialLanguage: LanguageCode = "ja") {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [themeMode, setThemeMode] = useStoredState<ThemeMode>(
    "theme-mode",
    getDefaultThemeMode,
    (stored) => (stored === "dark" ? "dark" : "light")
  );

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [themeMode]);

  return {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
  };
}
