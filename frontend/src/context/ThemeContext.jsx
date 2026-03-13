import React, { createContext, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../utils/constants";

const ThemeContext = createContext(null);

const getInitialTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "dark";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    const bodyClassList = document.body.classList;
    const rootClassList = document.documentElement.classList;

    bodyClassList.remove("theme-light", "theme-dark");
    rootClassList.remove("theme-light", "theme-dark");

    bodyClassList.add(`theme-${theme}`);
    rootClassList.add(`theme-${theme}`);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
};

export default ThemeContext;
