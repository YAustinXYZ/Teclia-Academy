import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { translate } from '../i18n/messages.js';
import { loadProfilePrefs, saveProfilePrefs } from '../utils/profilePrefs.js';

const THEME_KEY = 'teclia:theme:v1';
const LANG_KEY = 'teclia:lang:v1';

const PreferencesContext = createContext(null);

const readTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

const readLang = () => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
};

const applyTheme = (theme) => {
  const value = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', value);
  document.documentElement.style.colorScheme = value;
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // ignore
  }
};

const applyLang = (lang) => {
  const value = lang === 'en' ? 'en' : 'es';
  document.documentElement.lang = value;
  try {
    localStorage.setItem(LANG_KEY, value);
  } catch {
    // ignore
  }
};

export const PreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState(() => readLang());
  const [theme, setThemeState] = useState(() => readTheme());

  useEffect(() => {
    if (!user?.id) return;
    const prefs = loadProfilePrefs(user.id);
    if (prefs.language === 'en' || prefs.language === 'es') {
      setLanguageState(prefs.language);
      applyLang(prefs.language);
    }
    if (prefs.theme === 'light' || prefs.theme === 'dark') {
      setThemeState(prefs.theme);
      applyTheme(prefs.theme);
    }
  }, [user?.id]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyLang(language);
  }, [language]);

  const setLanguage = useCallback((next) => {
    const value = next === 'en' ? 'en' : 'es';
    setLanguageState(value);
    applyLang(value);
    if (user?.id) {
      const prefs = loadProfilePrefs(user.id);
      saveProfilePrefs(user.id, { ...prefs, language: value });
    }
  }, [user?.id]);

  const setTheme = useCallback((next) => {
    const value = next === 'light' ? 'light' : 'dark';
    setThemeState(value);
    applyTheme(value);
    if (user?.id) {
      const prefs = loadProfilePrefs(user.id);
      saveProfilePrefs(user.id, { ...prefs, theme: value });
    }
  }, [user?.id]);

  const t = useCallback((key, vars) => translate(language, key, vars), [language]);

  const value = useMemo(
    () => ({ language, theme, setLanguage, setTheme, t }),
    [language, theme, setLanguage, setTheme, t],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
};
