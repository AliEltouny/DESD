"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light"); // Default theme

  // Effect to load theme from localStorage and apply it on initial mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    console.log(`ThemeProvider: Initial theme set to ${initialTheme}`);
  }, []);

  // Effect to apply theme changes to the document and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === "light" ? "dark" : "light");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
    console.log(`ThemeProvider: Applied and saved theme ${theme}`);
  }, [theme]);

  // Function to toggle the theme
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}; 