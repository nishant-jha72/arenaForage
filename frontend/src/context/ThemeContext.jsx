// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem("af-theme") === "dark");

  useEffect(() => {
    localStorage.setItem("af-theme", dark ? "dark" : "light");
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// ── Theme tokens ──────────────────────────────────────────────────────────────
export const tokens = (dark) => ({
  bg:         dark ? "#09090b" : "#f9fafb",
  surface:    dark ? "#18181b" : "#ffffff",
  surface2:   dark ? "#27272a" : "#f4f4f5",
  border:     dark ? "#3f3f46" : "#e4e4e7",
  borderSub:  dark ? "#27272a" : "#f4f4f5",
  textPrim:   dark ? "#f4f4f5" : "#18181b",
  textSub:    dark ? "#a1a1aa" : "#71717a",
  textMuted:  dark ? "#71717a" : "#a1a1aa",
  accent:     "#dc2626",
  accentHov:  "#b91c1c",
  inputBg:    dark ? "#27272a" : "#ffffff",
  inputBorder:dark ? "#3f3f46" : "#e4e4e7",
  shadow:     dark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)",
  shadowAccent:"rgba(220,38,38,0.18)",
});