"use client";

import { useTheme, ThemePreference } from "./ThemeProvider";

const themes: {
  value: ThemePreference;
  label: string;
  icon: string;
}[] = [
  {
    value: "system",
    label: "System",
    icon: "◐",
  },
  {
    value: "light",
    label: "Light",
    icon: "☀",
  },
  {
    value: "dark",
    label: "Dark",
    icon: "☾",
  },
];

export default function ThemeControl() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className="theme-control"
      role="group"
      aria-label="Color theme"
    >
      {themes.map((theme) => {
        const active = preference === theme.value;

        return (
          <button
            key={theme.value}
            type="button"
            aria-label={`Use ${theme.label} theme`}
            aria-pressed={active}
            onClick={() => setPreference(theme.value)}
            className={`theme-option ${
              active ? "theme-option-active" : ""
            }`}
          >
            <span aria-hidden="true">{theme.icon}</span>
            <span className="hidden sm:inline">{theme.label}</span>
          </button>
        );
      })}
    </div>
  );
}