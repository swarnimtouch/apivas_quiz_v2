(function () {
  'use strict';

  const SOURCE_LANGUAGE = 'en';
  const STORAGE_KEY = 'preferred_language';
  const SUPPORTED_LANGUAGES = new Set(['en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'ur', 'kn', 'ml', 'or', 'pa']);
  const shouldResetLanguage = document.currentScript?.dataset.resetLanguage === 'true';

  function saveLanguage(language) {
    try {
      sessionStorage.setItem(STORAGE_KEY, language);
    } catch (error) {}
  }

  function getSavedLanguage() {
    try {
      const language = sessionStorage.getItem(STORAGE_KEY) || SOURCE_LANGUAGE;
      return SUPPORTED_LANGUAGES.has(language) ? language : SOURCE_LANGUAGE;
    } catch (error) {
      return SOURCE_LANGUAGE;
    }
  }

  function applyDocumentLanguage(language) {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  }

  function resetToEnglish() {
    saveLanguage(SOURCE_LANGUAGE);
    applyDocumentLanguage(SOURCE_LANGUAGE);
  }

  if (shouldResetLanguage) {
    resetToEnglish();
    window.addEventListener('pageshow', event => {
      resetToEnglish();
      if (event.persisted) window.location.reload();
    });
    return;
  }

  applyDocumentLanguage(getSavedLanguage());
}());
