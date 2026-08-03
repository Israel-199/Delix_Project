import React, { createContext, useContext, ReactNode } from 'react';
import { theme, Theme } from '../design-system';

const ThemeContext = createContext<Theme>(theme);

interface ThemeProviderProps {
  children: ReactNode;
  value?: Theme;
}

export const ThemeProvider = ({ children, value = theme }: ThemeProviderProps) => (
  <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
);

export const useTheme = (): Theme => useContext(ThemeContext);

export default ThemeProvider;
