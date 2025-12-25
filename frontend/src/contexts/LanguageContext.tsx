import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [language, setLanguage] = useState<string>(() => {
    // Try to get language from localStorage with user-specific key
    if (user?.id) {
      const stored = localStorage.getItem(`language_${user.id}`);
      if (stored === 'en' || stored === 'es') {
        return stored;
      }
    }
    // Fallback to default or browser language
    return localStorage.getItem('i18nextLng') || 'en';
  });

  // Update i18n when language changes
  useEffect(() => {
    i18n.changeLanguage(language);
    // Save to localStorage with user-specific key
    if (user?.id) {
      localStorage.setItem(`language_${user.id}`, language);
    }
    // Also save to default i18next location
    localStorage.setItem('i18nextLng', language);
  }, [language, i18n, user?.id]);

  // Load user's saved language preference when user changes
  useEffect(() => {
    if (user?.id) {
      const savedLanguage = localStorage.getItem(`language_${user.id}`);
      if (savedLanguage === 'en' || savedLanguage === 'es') {
        setLanguage(savedLanguage);
      }
    }
  }, [user?.id]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'es' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

