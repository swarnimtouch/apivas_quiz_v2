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


// ===== Typewriter Effect for Hero Title (index.html) =====
window.addEventListener('load', () => {
  const line1El = document.getElementById('type-line1');
  const line2El = document.getElementById('type-line2');
  
  if (!line1El || !line2El) return; // Only runs on index.html

  const text1 = "Observe the situation.";
  const text2 = "Choose the action.";
  
  let i = 0;
  let j = 0;
  const speed = 55; // Typing speed in milliseconds

  function typeLine1() {
    if (i < text1.length) {
      line1El.textContent += text1.charAt(i);
      i++;
      setTimeout(typeLine1, speed);
    } else {
      // Small delay before starting line 2
      setTimeout(typeLine2, 300);
    }
  }

  function typeLine2() {
    if (j < text2.length) {
      line2El.textContent += text2.charAt(j);
      j++;
      setTimeout(typeLine2, speed);
    } else {
      // NAYA: Jab typewriter ka text khatam ho jaye, tab Plus Icon ko show karein
      const plusIcon = document.querySelector('.bg-icon-plus');
      if (plusIcon) {
        plusIcon.classList.add('show-icon');
      }
    }
  }

  // Start typing after preloader finishes
  setTimeout(typeLine1, 800);
});