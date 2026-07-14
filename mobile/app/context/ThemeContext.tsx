// importa os hooks e tipos do React para criar o contexto
import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * ThemeContext — contexto global para tema e idioma da app
 * 
 * Este contexto guarda o estado do tema (dark/light) e do idioma (pt/en)
 * em memória. Todos os componentes da app podem aceder a estes valores
 * através do hook useTheme().
 * 
 * NOTA: Os valores não persistem entre sessões (não usa AsyncStorage).
 * O user precisa de mudar o tema/idioma em cada sessão.
 * Se quiseres persistência, podes usar SecureStore do Expo em vez de AsyncStorage.
 */

// tipo do contexto — define a estrutura dos valores e funções disponíveis
type ThemeContextType = {
  // darkMode indica se o tema escuro está ativo
  // true = tema escuro, false = tema claro (padrão)
  darkMode: boolean;
  // setDarkMode é a função que muda o estado do tema
  // recebe true ou false e atualiza o tema em toda a app
  setDarkMode: (value: boolean) => void;
  // toggleDarkMode alterna o tema entre claro e escuro
  // se estiver claro, fica escuro e vice-versa
  toggleDarkMode: () => void;
  // language guarda o idioma atual da app
  // "pt" = português, "en" = inglês
  language: "pt" | "en";
  // setLanguage muda o idioma da app
  // recebe "pt" ou "en" e atualiza todas as traduções
  setLanguage: (lang: "pt" | "en") => void;
};

// cria o contexto com valor inicial undefined
// o "!" diz ao TypeScript que o valor nunca será undefined quando usado
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider — componente que envolve a app e fornece o contexto
 * 
 * Deve ser colocado no _layout.tsx raiz da app para que todos
 * os ecrãs tenham acesso ao tema e idioma.
 * 
 * Exemplo de uso no _layout.tsx:
 * <ThemeProvider>
 *   <Stack>...</Stack>
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // darkMode começa a false (tema claro é o padrão)
  const [darkMode, setDarkModeState] = useState(false);
  // language começa a "pt" (português é o padrão)
  const [language, setLanguageState] = useState<"pt" | "en">("pt");

  /**
   * toggleDarkMode — alterna entre tema claro e escuro
   * 
   * Se darkMode for true, fica false (claro).
   * Se darkMode for false, fica true (escuro).
   * 
   * Usa useCallback para memorizar a função e evitar re-renders desnecessários.
   */
  const toggleDarkMode = useCallback(() => {
    // inverte o valor atual do darkMode
    setDarkModeState((prev) => !prev);
  }, []);

  // setDarkMode permite definir o tema diretamente (true ou false)
  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
  }, []);

  // setLanguage permite mudar o idioma diretamente ("pt" ou "en")
  const setLanguage = useCallback((lang: "pt" | "en") => {
    setLanguageState(lang);
  }, []);

  // o value contém todos os estados e funções que os componentes filhos podem usar
  const value: ThemeContextType = {
    darkMode,
    setDarkMode,
    toggleDarkMode,
    language,
    setLanguage,
  };

  return (
    // ThemeContext.Provider envolve os children com o contexto
    // todos os componentes dentro podem usar useTheme()
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme — hook para aceder ao contexto do tema
 * 
 * Deve ser usado dentro de qualquer componente que precise
 * de aceder ao tema ou idioma.
 * 
 * Exemplo de uso:
 * const { darkMode, language, toggleDarkMode, setLanguage } = useTheme();
 * 
 * Se for usado fora do ThemeProvider, dá erro.
 */
export function useTheme(): ThemeContextType {
  // busca o contexto atual
  const context = useContext(ThemeContext);
  // se o contexto for undefined, significa que o hook foi usado fora do ThemeProvider
  if (context === undefined) {
    // lança um erro para o developer saber que esqueceu de envolver com ThemeProvider
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  // retorna o contexto com todos os valores e funções
  return context;
}