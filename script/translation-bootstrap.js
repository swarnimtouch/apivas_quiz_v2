(function () {
  'use strict';

  const supportedLanguages = new Set([
    'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'ur', 'kn', 'ml', 'or', 'pa'
  ]);

  function getCookieLanguage() {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  try {
    const savedLanguage = sessionStorage.getItem('preferred_language') || getCookieLanguage();
    if (supportedLanguages.has(savedLanguage)) {
      document.documentElement.setAttribute('data-translation-pending', 'true');
    }
  } catch (error) {}
})();
