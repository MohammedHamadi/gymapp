import { useEffect, useState } from "react";

export function useStatusFilter(key: string, allowed: readonly string[]) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved && allowed.includes(saved) ? saved : "ALL";
    } catch {
      return "ALL";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Filtering remains available if storage is unavailable.
    }
  }, [key, value]);
  return [value, setValue] as const;
}
