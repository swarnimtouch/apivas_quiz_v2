// ===== AOS Init =====
AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50
});

// ===== Element Selectors =====
const balanceVideo = document.getElementById('balance-video');
const btnAllGood = document.getElementById('btnAllGood');
const btnMedicalAttention = document.getElementById('btnMedicalAttention');
const feedbackModal = document.getElementById('feedbackModal');
const modalIcon = document.getElementById('modalIcon');
const beaconIcon = document.getElementById('beaconIcon');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const nextLevelBtn = document.getElementById('nextLevelBtn');

let isAnswered = false;

// ===== Autoplay Video on Load =====
window.addEventListener('load', () => {
  // Ensure video plays automatically (muted autoplay is generally allowed)
  balanceVideo.play().catch(e => console.log("Autoplay prevented:", e));
  
  // Event listener for when balance_2.mp4 finishes playing
  balanceVideo.addEventListener('ended', () => {
    // Only show modal if the video that just ended is balance_2.mp4 
    // (prevents it from firing if the first video somehow ends without looping)
    if (isAnswered) {
      showModal('error', 'Incorrect Choice!', 'Look again. Sudden loss of balance, dizziness or poor coordination can be a warning sign of stroke.');
    }
  });
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

// ===== Click Handlers =====
btnAllGood.addEventListener('click', () => {
  if (isAnswered) return;
  isAnswered = true;
  
  // Stop current playback before switching source
  balanceVideo.pause();
  balanceVideo.loop = false;
  balanceVideo.src = 'media/balance_2.mp4';
  
  // Mandatory for mobile browsers (iOS Safari / Android Chrome) to load the new video immediately
  balanceVideo.load();
  
  const playPromise = balanceVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => console.log("Play prevented:", e));
  }
  
  // The 'ended' event listener in window.load will trigger the popup after video finishes
});

btnMedicalAttention.addEventListener('click', () => {
  if (isAnswered) return;
  isAnswered = true;
  
  // Pause the video immediately
  balanceVideo.pause();
  balanceVideo.removeAttribute('loop');
  
  // Show Success Modal with Checkmark Icon directly
  showModal('success', 'Absolutely Right!', 'You correctly identified the stroke symptom. Acting fast in such situations can save lives and prevent brain damage.');
});

// ===== Modal Controls =====
function showModal(type, title, text) {
  // Toggle Icons Based on Type
  if (type === 'success') {
    modalIcon.style.display = 'flex';
    beaconIcon.style.display = 'none';
  } else {
    modalIcon.style.display = 'none';
    beaconIcon.style.display = 'flex';
  }
    
  modalTitle.innerText = title;
  modalText.innerText = text;
  feedbackModal.classList.add('show');
}

nextLevelBtn.addEventListener('click', () => {
  feedbackModal.classList.remove('show');
  // Reset for demo purposes (or redirect to next page)
  setTimeout(() => {
    isAnswered = false;
    // Resume video if needed, or redirect to next page
    // window.location.href = "7.html"; 
  }, 300);
});