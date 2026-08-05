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