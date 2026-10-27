// ===== Preloader =====
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  setTimeout(() => preloader.classList.add('hidden'), 600);
});

// ===== AOS Init =====
AOS.init({
  duration: 900,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50
});

// ===== Parallax Mouse Movement on Background Shapes Only =====
const shapes = document.querySelectorAll('.shape');

document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5);
  const y = (e.clientY / window.innerHeight - 0.5);

  // Only moving background shapes slightly, center content stays completely still.
  shapes.forEach((shape, i) => {
    const multiplier = (i + 1) * 15;
    shape.style.transform = `translate(${x * multiplier}px, ${y * multiplier}px)`;
  });
});

// ===== Game Intro Modal & Start Quiz =====
const startBtn = document.getElementById('startQuizBtn');
const gameIntroModal = document.getElementById('gameIntroModal');
const confirmPlayGameBtn = document.getElementById('confirmPlayGameBtn');
let isQuizStarting = false;

// Clear previous intro session flag when arriving at index.html
try {
  sessionStorage.removeItem('gameIntroSeen');
} catch (e) {}

function getQuizUserId() {
  let uid = '';
  try {
    if (sessionStorage.getItem('quiz_completed_session') === 'true') {
      sessionStorage.removeItem('quiz_completed_session');
      sessionStorage.removeItem('tracked_quiz_complete');
      localStorage.removeItem('quiz_user_uid');
    }
    uid = localStorage.getItem('quiz_user_uid');
    if (!uid) {
      uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('quiz_user_uid', uid);
    }
  } catch (e) {
    uid = 'u_temp_' + Math.random().toString(36).substring(2, 9);
  }
  return uid;
}

function getQuizLanguage() {
  try {
    if (window.appI18n && typeof window.appI18n.getLanguage === 'function') {
      return window.appI18n.getLanguage();
    }
    return sessionStorage.getItem('preferred_language') || 'en';
  } catch (e) {
    return 'en';
  }
}

function trackQuizEvent(params) {
  params = params || {};
  if (!params.user_id) params.user_id = getQuizUserId();
  if (!params.lang) params.lang = getQuizLanguage();

  const formData = new URLSearchParams();
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      formData.append(key, String(params[key]));
    }
  }

  const endpoint = 'api/track.php';
  const body = formData.toString();

  if (typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/x-www-form-urlencoded;charset=UTF-8' });
    if (navigator.sendBeacon(endpoint, blob)) {
      return;
    }
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body,
    keepalive: true
  }).catch(() => {});
}

// Initial visitor and language tracking is strictly recorded when the user clicks CONTINUE on the language selection screen

function openGameIntroModal() {
  if (!gameIntroModal) {
    proceedToQuiz(startBtn);
    return;
  }
  gameIntroModal.classList.add('show');
  gameIntroModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeGameIntroModal() {
  if (!gameIntroModal) return;
  gameIntroModal.classList.remove('show');
  gameIntroModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function proceedToQuiz(sourceBtn) {
  if (isQuizStarting) return;
  isQuizStarting = true;
  if (confirmPlayGameBtn) confirmPlayGameBtn.disabled = true;
  if (startBtn) startBtn.disabled = true;

  try {
    sessionStorage.setItem('gameIntroSeen', 'true');
  } catch (e) {}

  trackQuizEvent({ event: 'lets_begin' });

  if (sourceBtn) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.4);
      transform: scale(0);
      pointer-events: none;
      width: 20px;
      height: 20px;
      left: 50%;
      top: 50%;
      margin-left: -10px;
      margin-top: -10px;
      animation: rippleExpand 0.6s ease-out;
      z-index: 0;
    `;
    sourceBtn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  setTimeout(() => {
    window.location.href = "quiz.html";
  }, 250);
}

if (startBtn) {
  startBtn.addEventListener('click', function (e) {
    e.preventDefault();
    trackQuizEvent({ event: 'play_game' });
    openGameIntroModal();
  });
}

if (confirmPlayGameBtn) {
  confirmPlayGameBtn.addEventListener('click', function (e) {
    e.preventDefault();
    proceedToQuiz(this);
  });
}

if (gameIntroModal) {
  gameIntroModal.addEventListener('click', function (e) {
    if (!e.target.closest('.modal-content-box')) {
      closeGameIntroModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && gameIntroModal.classList.contains('show')) {
      closeGameIntroModal();
    }
  });
}

// Inject Ripple Keyframe dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleExpand {
    to { transform: scale(30); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ===== Language Selection & Typewriter Flow (index.html) =====
window.addEventListener('load', () => {
  const line1El = document.getElementById('type-line1');
  const line2El = document.getElementById('type-line2');
  const langOverlay = document.getElementById('langScreenOverlay');
  const confirmLangBtn = document.getElementById('confirmLangBtn');
  const heroContent = document.getElementById('heroContent');
  const langSelect = document.getElementById('languageSelect');
  
  if (!line1El || !line2El) return; // Only runs on index.html

  let text1 = 'Observe each situation carefully and';
  let text2 = 'choose the appropriate option';
  
  let i = 0;
  let j = 0;
  const speed = 55; // Typing speed in milliseconds
  let typewriterStarted = false;

  function typeLine1() {
    if (i < text1.length) {
      line1El.textContent += text1.charAt(i);
      i++;
      setTimeout(typeLine1, speed);
    } else {
      setTimeout(typeLine2, 300);
    }
  }

  function typeLine2() {
    if (j < text2.length) {
      line2El.textContent += text2.charAt(j);
      j++;
      setTimeout(typeLine2, speed);
    } else {
      const plusIcon = document.querySelector('.bg-icon-plus');
      if (plusIcon) {
        plusIcon.classList.add('show-icon');
      }
    }
  }

  function triggerTypewriter() {
    if (typewriterStarted) return;
    typewriterStarted = true;

    if (window.appI18n) {
      text1 = window.appI18n.t('home.heroLine1', text1);
      text2 = window.appI18n.t('home.heroLine2', text2);
    }

    const selectedLanguage = window.appI18n
      ? window.appI18n.getLanguage()
      : (langSelect ? langSelect.value : 'en');
    if (selectedLanguage !== 'en') {
      line1El.textContent = text1;
      line2El.textContent = text2;
      const plusIcon = document.querySelector('.bg-icon-plus');
      if (plusIcon) plusIcon.classList.add('show-icon');
      return;
    }

    setTimeout(typeLine1, 400);
  }

  if (langOverlay && confirmLangBtn) {
    confirmLangBtn.addEventListener('click', async () => {
      const selectedLang = langSelect ? langSelect.value : (getQuizLanguage() || 'en');
      confirmLangBtn.disabled = true;

      const previousConfirmedLang = sessionStorage.getItem('confirmed_quiz_lang');
      if (previousConfirmedLang && previousConfirmedLang !== selectedLang) {
        try {
          localStorage.removeItem('quiz_user_uid');
        } catch (e) {}
      }
      try {
        sessionStorage.setItem('confirmed_quiz_lang', selectedLang);
      } catch (e) {}

      if (window.appI18n) {
        await window.appI18n.setLanguage(selectedLang);
      }

      // Track user visit and selected language strictly when CONTINUE button is clicked
      trackQuizEvent({ event: 'visitor', lang: selectedLang });

      // Fade out language overlay
      langOverlay.classList.add('lang-fade-out');

      // Reveal hero content
      if (heroContent) {
        heroContent.classList.remove('hero-pending');
        heroContent.classList.add('hero-active');
      }

      setTimeout(() => {
        langOverlay.classList.add('hidden');
        if (window.AOS) window.AOS.refresh();
      }, 400);

      // Start typewriter once screen is visible
      triggerTypewriter();
    });
  } else {
    // If no language overlay, start directly after preloader
    setTimeout(triggerTypewriter, 800);
  }
});

// ===== Idle Prefetch Quiz Initial Assets =====
let quizAssetsPrefetched = false;
function prefetchInitialQuizAssets() {
  if (quizAssetsPrefetched) return;
  quizAssetsPrefetched = true;

  const initialAssets = ['media/balance.mp4', 'media/stopwatch_sample.mp4'];
  initialAssets.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'video';
    link.href = url;
    document.head.appendChild(link);

    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    v.load();
  });
}

if (startBtn) {
  startBtn.addEventListener('pointerenter', prefetchInitialQuizAssets, { once: true, passive: true });
  startBtn.addEventListener('touchstart', prefetchInitialQuizAssets, { once: true, passive: true });
}

window.addEventListener('load', () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetchInitialQuizAssets, { timeout: 3000 });
  } else {
    setTimeout(prefetchInitialQuizAssets, 1500);
  }
}, { once: true });

