(function () {
  'use strict';

  const supportedLanguages = new Set([
    'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'ur', 'kn', 'ml', 'or', 'pa'
  ]);
  const shouldResetLanguage = document.currentScript?.dataset.resetLanguage === 'true';

  function getCookieLanguage() {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function expireGoogleTranslateCookies() {
    const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `googtrans=; expires=${expires}; path=/; SameSite=Lax`;

    const hostname = window.location.hostname;
    if (!hostname || hostname === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return;

    const hostnameParts = hostname.split('.');
    for (let index = 0; index < hostnameParts.length - 1; index++) {
      const domain = `.${hostnameParts.slice(index).join('.')}`;
      document.cookie = `googtrans=; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`;
    }
  }

  function resetLanguageToEnglish() {
    try {
      sessionStorage.setItem('preferred_language', 'en');
    } catch (error) {}

    expireGoogleTranslateCookies();
    document.documentElement.removeAttribute('data-translation-pending');
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  }

  if (shouldResetLanguage) {
    resetLanguageToEnglish();
    window.addEventListener('pageshow', event => {
      resetLanguageToEnglish();
      if (event.persisted) window.location.reload();
    });
    return;
  }

  try {
    const savedLanguage = sessionStorage.getItem('preferred_language') || getCookieLanguage();
    if (supportedLanguages.has(savedLanguage)) {
      document.documentElement.setAttribute('data-translation-pending', 'true');
    }
  } catch (error) {}
})();
