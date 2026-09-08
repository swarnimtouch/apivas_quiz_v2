(function () {
  'use strict';

  const SOURCE_LANGUAGE = 'en';
  const STORAGE_KEY = 'preferred_language';
  const SUPPORTED_LANGUAGES = new Set(['en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'ur', 'kn', 'ml', 'or', 'pa']);
  const LANGUAGE_FILES = {
    en: 'english',
    hi: 'hindi',
    bn: 'bengali',
    mr: 'marathi',
    te: 'telugu',
    ta: 'tamil',
    gu: 'gujarati',
    ur: 'urdu',
    kn: 'kannada',
    ml: 'malayalam',
    or: 'odia',
    pa: 'punjabi'
  };
  const dictionaries = new Map();
  let currentLanguage = getSavedLanguage();
  let messages = {};

  function normalizeLanguage(language) {
    return SUPPORTED_LANGUAGES.has(language) ? language : SOURCE_LANGUAGE;
  }

  function getSavedLanguage() {
    try {
      return normalizeLanguage(sessionStorage.getItem(STORAGE_KEY) || SOURCE_LANGUAGE);
    } catch (error) {
      return SOURCE_LANGUAGE;
    }
  }

  function saveLanguage(language) {
    try {
      sessionStorage.setItem(STORAGE_KEY, language);
    } catch (error) {}
  }

  function resolveValue(source, key) {
    return key.split('.').reduce((value, part) => {
      if (value === null || value === undefined) return undefined;
      return value[part];
    }, source);
  }

  function formatValue(value, replacements) {
    if (typeof value !== 'string' || !replacements) return value;

    return value.replace(/\{(\w+)\}/g, (match, key) => {
      return Object.prototype.hasOwnProperty.call(replacements, key)
        ? String(replacements[key])
        : match;
    });
  }

  function translate(key, fallback = '', replacements) {
    const value = resolveValue(messages, key);
    return formatValue(value === undefined ? fallback : value, replacements);
  }

  async function loadDictionary(language) {
    if (dictionaries.has(language)) return dictionaries.get(language);

    const response = await fetch(`locales/${LANGUAGE_FILES[language]}.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Unable to load ${language} translations (${response.status})`);

    const dictionary = await response.json();
    dictionaries.set(language, dictionary);
    return dictionary;
  }

  function applyDocumentTranslations() {
    const titleKey = document.documentElement.dataset.pageTitleKey;
    if (titleKey) document.title = translate(titleKey, document.title);

    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = translate(element.dataset.i18n, element.textContent);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      element.innerHTML = translate(element.dataset.i18nHtml, element.innerHTML);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel, element.getAttribute('aria-label') || ''));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      element.setAttribute('title', translate(element.dataset.i18nTitle, element.getAttribute('title') || ''));
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
      element.setAttribute('alt', translate(element.dataset.i18nAlt, element.getAttribute('alt') || ''));
    });

    document.querySelectorAll('.befast-caption-letter').forEach(element => {
      element.textContent = currentLanguage === 'gu'
        ? element.dataset.letterGu
        : element.dataset.letterDefault;
    });

    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ur' ? 'rtl' : 'ltr';
  }

  async function setLanguage(language, options = {}) {
    const requestedLanguage = normalizeLanguage(language);

    try {
      messages = await loadDictionary(requestedLanguage);
      currentLanguage = requestedLanguage;
    } catch (error) {
      console.error(error);
      currentLanguage = SOURCE_LANGUAGE;

      try {
        messages = await loadDictionary(SOURCE_LANGUAGE);
      } catch (fallbackError) {
        console.error(fallbackError);
        messages = {};
      }
    }

    if (options.persist !== false) saveLanguage(currentLanguage);
    applyDocumentTranslations();

    window.dispatchEvent(new CustomEvent('app-language-change', {
      detail: { language: currentLanguage }
    }));

    return currentLanguage;
  }

  const api = {
    getLanguage: () => currentLanguage,
    setLanguage,
    t: translate,
    ready: Promise.resolve(SOURCE_LANGUAGE)
  };

  window.appI18n = api;
  api.ready = setLanguage(currentLanguage, { persist: false });
}());
