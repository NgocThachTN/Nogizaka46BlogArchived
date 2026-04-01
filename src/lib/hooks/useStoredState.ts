import { useEffect, useState } from "react";

export function useStoredState<T>(
  key: string,
  getDefaultValue: () => T,
  parse?: (raw: string) => T
) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return getDefaultValue();
    }

    try {
      const stored = window.localStorage.getItem(key);
      if (stored == null) {
        return getDefaultValue();
      }

      return parse ? parse(stored) : (stored as T);
    } catch {
      return getDefaultValue();
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Ignore persistence failures.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
