import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system'); // 'light', 'dark', 'system'
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // On mount, read saved preference
  useEffect(() => {
    const saved = localStorage.getItem('fpl-theme');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setTheme(saved);
    }
  }, []);

  // Resolve system preference and apply dark class
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      let resolved;
      if (theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolved = theme;
      }
      setResolvedTheme(resolved);

      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    apply();

    // Listen for OS theme changes when in system mode
    const handler = () => {
      if (theme === 'system') apply();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Persist preference
  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('fpl-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
