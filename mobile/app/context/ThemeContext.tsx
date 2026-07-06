import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

// Tipo do tema
type ThemeMode = "light" | "dark" | "system";

// Interface do contexto
interface ThemeContextType {
  theme: "light" | "dark";
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

// Cores para cada tema
export const colors = {
  light: {
    bg: "#F1F8E9",
    card: "#FFFFFF",
    text: "#1A1A1A",
    textSecondary: "#486623",
    primary: "#3A6604",
    primaryLight: "#65B307",
    border: "#C8E6C9",
    inputBg: "#F1F8E9",
    placeholder: "#8DA87A",
    danger: "#ED4956",
    overlay: "rgba(0,0,0,0.5)",
    tabBar: "#FFFFFF",
    tabBarBorder: "#C8E6C9",
  },
  dark: {
    bg: "#0D1117",
    card: "#161B22",
    text: "#E6EDF3",
    textSecondary: "#8B949E",
    primary: "#7EE787",
    primaryLight: "#56D364",
    border: "#30363D",
    inputBg: "#21262D",
    placeholder: "#6E7681",
    danger: "#F85149",
    overlay: "rgba(0,0,0,0.7)",
    tabBar: "#161B22",
    tabBarBorder: "#30363D",
  },
};

// Contexto
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themeMode: "system",
  setThemeMode: () => {},
  isDark: false,
});

// Hook para usar o tema
export const useTheme = () => useContext(ThemeContext);

// Hook para obter as cores do tema atual
export const useColors = () => {
  const { theme } = useTheme();
  return colors[theme];
};

// Provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemTheme = useSystemColorScheme(); // "light" | "dark" | null
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  // Determina o tema atual baseado no modo e no sistema
  const theme: "light" | "dark" =
    themeMode === "system"
      ? (systemTheme ?? "light")
      : themeMode;

  const isDark = theme === "dark";

  // Função para mudar o modo
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};