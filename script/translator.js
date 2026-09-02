(function () {
  'use strict';

  const SOURCE_LANGUAGE = 'en';
  const STORAGE_KEY = 'preferred_language';
  const SUPPORTED_LANGUAGES = new Set([
    'en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'ur', 'kn', 'ml', 'or', 'pa'
  ]);
  const GOOGLE_TARGET_LANGUAGES = [...SUPPORTED_LANGUAGES]
    .filter(language => language !== SOURCE_LANGUAGE)
    .join(',');
  const MAX_WIDGET_RETRIES = 40;
  const WIDGET_RETRY_DELAY_MS = 250;
  const TRANSLATION_MIN_VISIBLE_MS = 450;
  const TRANSLATION_SETTLE_MS = 300;
  const TRANSLATION_MAX_WAIT_MS = 9000;
  const TRANSLATION_PENDING_ATTRIBUTE = 'data-translation-pending';
  const GOOGLE_UI_SELECTOR = [
    'iframe.goog-te-banner-frame',
    '.goog-te-banner-frame',
    'iframe.VIpgJd-ZVi9od-ORHb-OEVmcd',
    '.VIpgJd-ZVi9od-ORHb-OEVmcd',
    '#goog-gt-tt',
    '.goog-te-balloon-frame',
    '.VIpgJd-yAWNEb-L7lbkb',
    '.goog-te-spinner-pos',
    '.VIpgJd-ZVi9od-aZ2wEe-wOHMyf'
  ].join(',');
  let translationWaitState = null;

  function hideInjectedGoogleUi(element) {
    const host = document.getElementById('google_translate_element');
    if (!(element instanceof HTMLElement) || element === host || (host && host.contains(element))) return;

    element.style.setProperty('display', 'none', 'important');
    element.style.setProperty('visibility', 'hidden', 'important');
    element.style.setProperty('width', '0', 'important');
    element.style.setProperty('height', '0', 'important');
    element.setAttribute('aria-hidden', 'true');
  }

  function resetGooglePageOffset() {
    document.documentElement.style.setProperty('margin-top', '0px', 'important');
    if (document.body) document.body.style.setProperty('top', '0px', 'important');
  }

  function suppressGoogleUi(root = document) {
    resetGooglePageOffset();

    if (root instanceof HTMLElement && root.matches(GOOGLE_UI_SELECTOR)) {
      hideInjectedGoogleUi(root);
    }

    if (root.querySelectorAll) {
      root.querySelectorAll(GOOGLE_UI_SELECTOR).forEach(hideInjectedGoogleUi);
    }
  }

  function watchForGoogleUi() {
    suppressGoogleUi();

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) suppressGoogleUi(node);
        });
      });
      resetGooglePageOffset();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function isGoogleUiMutation(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const host = document.getElementById('google_translate_element');
    return !element || (host && host.contains(element)) || Boolean(element.closest(GOOGLE_UI_SELECTOR));
  }

  function translationLooksReady(language) {
    const combo = document.querySelector('.goog-te-combo');
    const htmlIsTranslated = document.documentElement.classList.contains('translated-ltr') ||
      document.documentElement.classList.contains('translated-rtl');
    return Boolean(combo && combo.value === language && htmlIsTranslated);
  }

  function updatePageSpecificLocalizedText(language) {
    const useGujaratiLetters = language === 'gu';
    document.querySelectorAll('[data-letter-default][data-letter-gu]').forEach(letter => {
      letter.textContent = useGujaratiLetters ? letter.dataset.letterGu : letter.dataset.letterDefault;
      letter.lang = useGujaratiLetters ? 'gu' : 'en';
    });
  }

  function finishTranslationWait(state) {
    if (!state || translationWaitState !== state) return;

    state.observer.disconnect();
    window.clearInterval(state.pollTimer);
    window.clearTimeout(state.fallbackTimer);
    translationWaitState = null;
    updatePageSpecificLocalizedText(state.language);
    document.documentElement.removeAttribute(TRANSLATION_PENDING_ATTRIBUTE);

    if (window.AOS) window.AOS.refresh();
  }

  function cancelTranslationWait() {
    if (translationWaitState) {
      translationWaitState.observer.disconnect();
      window.clearInterval(translationWaitState.pollTimer);
      window.clearTimeout(translationWaitState.fallbackTimer);
      translationWaitState = null;
    }
    document.documentElement.removeAttribute(TRANSLATION_PENDING_ATTRIBUTE);
  }

  function beginTranslationWait(language) {
    const normalizedLanguage = normalizeLanguage(language);
    cancelTranslationWait();

    if (normalizedLanguage === SOURCE_LANGUAGE) return;

    document.documentElement.setAttribute(TRANSLATION_PENDING_ATTRIBUTE, 'true');
    const now = Date.now();
    const state = {
      language: normalizedLanguage,
      startedAt: now,
      readyAt: 0,
      lastMutationAt: now,
      observer: null,
      pollTimer: null,
      fallbackTimer: null
    };

    state.observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => !isGoogleUiMutation(mutation.target))) {
        state.lastMutationAt = Date.now();
      }
    });
    state.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    state.pollTimer = window.setInterval(() => {
      const checkTime = Date.now();
      if (!translationLooksReady(state.language)) {
        state.readyAt = 0;
        return;
      }

      if (!state.readyAt) state.readyAt = checkTime;
      const minimumTimePassed = checkTime - state.startedAt >= TRANSLATION_MIN_VISIBLE_MS;
      const readyTimePassed = checkTime - state.readyAt >= TRANSLATION_SETTLE_MS;
      const domIsSettled = checkTime - state.lastMutationAt >= TRANSLATION_SETTLE_MS;

      if (minimumTimePassed && readyTimePassed && domIsSettled) {
        finishTranslationWait(state);
      }
    }, 75);

    state.fallbackTimer = window.setTimeout(() => finishTranslationWait(state), TRANSLATION_MAX_WAIT_MS);
    translationWaitState = state;
  }

  function normalizeLanguage(language) {
    return SUPPORTED_LANGUAGES.has(language) ? language : SOURCE_LANGUAGE;
  }

  function getSavedLanguage() {
    try {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
      const cookieLanguage = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
      return normalizeLanguage(sessionStorage.getItem(STORAGE_KEY) || cookieLanguage || SOURCE_LANGUAGE);
    } catch (error) {
      return SOURCE_LANGUAGE;
    }
  }

  function saveLanguage(language) {
    try {
      sessionStorage.setItem(STORAGE_KEY, normalizeLanguage(language));
    } catch (error) {}
  }

  function getCookieDomain() {
    const hostname = window.location.hostname;
    if (!hostname || hostname === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return '';

    const parts = hostname.split('.');
    return parts.length > 1 ? `.${parts.slice(-2).join('.')}` : '';
  }

  function writeGoogleTranslateCookie(language) {
    const value = `/en/${language}`;
    document.cookie = `googtrans=${value}; path=/; SameSite=Lax`;

    const domain = getCookieDomain();
    if (domain) document.cookie = `googtrans=${value}; path=/; domain=${domain}; SameSite=Lax`;
  }

  function expireGoogleTranslateCookie() {
    const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `googtrans=; expires=${expires}; path=/; SameSite=Lax`;

    const domain = getCookieDomain();
    if (domain) document.cookie = `googtrans=; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`;
  }

  function hasActiveGoogleTranslation() {
    return document.cookie.split(';').some(cookie => cookie.trim().startsWith('googtrans=/en/'));
  }

  function dispatchWidgetLanguage(language, attempt = 0) {
    const combo = document.querySelector('.goog-te-combo');
    if (!combo) {
      if (attempt < MAX_WIDGET_RETRIES) {
        window.setTimeout(() => dispatchWidgetLanguage(language, attempt + 1), WIDGET_RETRY_DELAY_MS);
      }
      return;
    }

    combo.value = language;
    combo.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function applyLanguage(language, options = {}) {
    const normalizedLanguage = normalizeLanguage(language);
    saveLanguage(normalizedLanguage);
    updatePageSpecificLocalizedText(normalizedLanguage);
    document.documentElement.lang = normalizedLanguage;
    document.documentElement.dir = normalizedLanguage === 'ur' ? 'rtl' : 'ltr';

    if (normalizedLanguage === SOURCE_LANGUAGE) {
      cancelTranslationWait();
      const translationWasActive = hasActiveGoogleTranslation();
      expireGoogleTranslateCookie();

      if (translationWasActive && options.reloadForEnglish !== false) {
        window.location.reload();
      }
      return;
    }

    beginTranslationWait(normalizedLanguage);
    writeGoogleTranslateCookie(normalizedLanguage);
    dispatchWidgetLanguage(normalizedLanguage);
  }

  window.googleTranslateElementInit = function () {
    const host = document.getElementById('google_translate_element');
    if (!host || !window.google || !google.translate) return;

    new google.translate.TranslateElement({
      pageLanguage: SOURCE_LANGUAGE,
      includedLanguages: GOOGLE_TARGET_LANGUAGES,
      autoDisplay: false
    }, 'google_translate_element');

    suppressGoogleUi();

    const savedLanguage = getSavedLanguage();
    if (savedLanguage !== SOURCE_LANGUAGE) {
      window.setTimeout(() => dispatchWidgetLanguage(savedLanguage), 100);
    }
  };

  window.refreshGoogleWebsiteTranslation = function () {
    const savedLanguage = getSavedLanguage();
    if (savedLanguage !== SOURCE_LANGUAGE) {
      beginTranslationWait(savedLanguage);
      window.setTimeout(() => dispatchWidgetLanguage(savedLanguage), 50);
    }
  };

  const savedLanguage = getSavedLanguage();
  updatePageSpecificLocalizedText(savedLanguage);
  watchForGoogleUi();
  if (savedLanguage !== SOURCE_LANGUAGE) {
    beginTranslationWait(savedLanguage);
    writeGoogleTranslateCookie(savedLanguage);
  } else {
    cancelTranslationWait();
  }
  document.documentElement.lang = savedLanguage;
  document.documentElement.dir = savedLanguage === 'ur' ? 'rtl' : 'ltr';

  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) languageSelect.value = savedLanguage;

  const confirmLanguageButton = document.getElementById('confirmLangBtn');
  if (confirmLanguageButton) {
    confirmLanguageButton.addEventListener('click', () => {
      applyLanguage(languageSelect ? languageSelect.value : SOURCE_LANGUAGE);
    });
  }

  const backToHomeButton = document.getElementById('backToHomeBtn');
  if (backToHomeButton) {
    backToHomeButton.addEventListener('click', () => {
      saveLanguage(SOURCE_LANGUAGE);
      cancelTranslationWait();
      expireGoogleTranslateCookie();
      document.documentElement.lang = SOURCE_LANGUAGE;
      document.documentElement.dir = 'ltr';
    });
  }
})();
