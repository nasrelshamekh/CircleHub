import { themeContext } from '@/context/ThemeContext';
import { useContext } from 'react'

export function useTheme() {
  const context = useContext(themeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
