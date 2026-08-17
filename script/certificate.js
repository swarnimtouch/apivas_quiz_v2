// ===== AOS Init =====
AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50
});

// ===== Parallax Mouse Movement on Background Shapes =====
const shapes = document.querySelectorAll('.shape');

document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5);
  const y = (e.clientY / window.innerHeight - 0.5);

  shapes.forEach((shape, i) => {
    const multiplier = (i + 1) * 15;
    shape.style.transform = `translate(${x * multiplier}px, ${y * multiplier}px)`;
  });
});
