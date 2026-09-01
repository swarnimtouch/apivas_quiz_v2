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

// ===== Button Ripple Effect =====
const startBtn = document.getElementById('startQuizBtn');

if (startBtn) {
  startBtn.addEventListener('click', function (e) {
    // Ripple Creation
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

    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    // Redirect to quiz page after ripple animation
    setTimeout(() => {
      window.location.href = "quiz.html";
    }, 400);
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

  const text1 = "Observe each situation carefully and";
  const text2 = "choose the appropriate option";
  
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
      if (window.refreshGoogleWebsiteTranslation) {
        window.refreshGoogleWebsiteTranslation();
      }
    }
  }

  function triggerTypewriter() {
    if (typewriterStarted) return;
    typewriterStarted = true;

    const selectedLanguage = langSelect ? langSelect.value : 'en';
    if (selectedLanguage !== 'en') {
      line1El.textContent = text1;
      line2El.textContent = text2;
      const plusIcon = document.querySelector('.bg-icon-plus');
      if (plusIcon) plusIcon.classList.add('show-icon');
      if (window.refreshGoogleWebsiteTranslation) {
        window.refreshGoogleWebsiteTranslation();
      }
      return;
    }

    setTimeout(typeLine1, 400);
  }

  if (langOverlay && confirmLangBtn) {
    confirmLangBtn.addEventListener('click', () => {
      const selectedLang = langSelect ? langSelect.value : 'en';
      try {
        sessionStorage.setItem('preferred_language', selectedLang);
      } catch (e) {}

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
