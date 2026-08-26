import React, { createContext, useContext } from "react";

/**
 * ShowTimeX is a single-theme product ("Gallery", light).
 *
 * This provider is kept only so existing consumers of useTheme() keep working
 * while pages migrate to semantic tokens. It always reports "light" and
 * toggleTheme is a no-op, so any remaining `isDark ? a : b` in the codebase
 * resolves to the light branch.
 *
 * Delete this file once no component calls useTheme().
 */
const ThemeContext = createContext({ theme: "light" });

const VALUE = { theme: "light", isDark: false, setTheme: () => {}, toggleTheme: () => {} };

export const ThemeProvider = ({ children }) => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("theme-light");
    document.documentElement.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
    document.body.classList.remove("theme-dark");
  }
  return <ThemeContext.Provider value={VALUE}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
