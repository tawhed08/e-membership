"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "e-membership-theme";

function readPreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }

  return "system";
}

function subscribePreference(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = () => onChange();
  const handleThemeChange = () => onChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener("membership-theme-change", handleThemeChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("membership-theme-change", handleThemeChange);
  };
}

function readSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribeSystemTheme(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = () => onChange();

  media.addEventListener("change", handleChange);

  return () => {
    media.removeEventListener("change", handleChange);
  };
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribePreference,
    readPreference,
    () => "system"
  );

  const systemTheme = useSyncExternalStore<"light" | "dark">(
    subscribeSystemTheme,
    readSystemTheme,
    () => "light"
  );

  const resolvedTheme: "light" | "dark" =
    preference === "system" ? systemTheme : preference;

  useEffect(() => {
    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");

    // Apply current theme
    root.classList.add(resolvedTheme);

    // Also expose theme through data-theme
    root.dataset.theme = resolvedTheme;

    // Keep color-scheme in sync with the selected theme
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      window.localStorage.setItem(STORAGE_KEY, next);

      window.dispatchEvent(new Event("membership-theme-change"));
    },
    []
  );

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}