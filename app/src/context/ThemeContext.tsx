import React, { createContext, useContext, useEffect, useState } from "react";
import type { Theme } from "@/types";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_ORDER: Theme[] = ["classic", "light", "sepia", "lecture"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("tsinephu-theme");
    const validThemes: Theme[] = ["classic", "light", "sepia", "lecture"];
    return validThemes.includes(saved as Theme) ? (saved as Theme) : "classic";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Apply theme via data attribute
    root.setAttribute("data-theme", theme);
    // Also maintain 'dark' class for backward compatibility with any legacy code
    if (theme === "classic") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("tsinephu-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const currentIndex = THEME_ORDER.indexOf(prev);
      const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
      return THEME_ORDER[nextIndex];
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
