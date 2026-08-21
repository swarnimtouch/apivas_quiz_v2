// ===== Quiz Data =====
const quizLevels = [
  {
    icon: 'B',
    title: 'BALANCE LOSS',
    text: 'Sudden loss of balance, dizziness or coordination',
    video: 'media/balance.mp4',
    question: 'Mr Ramesh suddenly experienced loss of balance, dizziness or difficulty coordinating his movements.',
    incorrectText: 'Look again. Sudden loss of balance, dizziness or poor coordination can be a warning sign of stroke. Seek urgent medical attention.',
    successText: 'You correctly identified the stroke symptom. Acting fast in such situations can save lives and prevent brain damage.'
  },
  {
    icon: 'E',
    title: 'BLURRED VISION',
    text: 'Sudden trouble seeing in one or both eyes',
    video: 'media/trouble in seeing.mp4',
    question: 'Mrs Meena suddenly experienced blurred vision or difficulty seeing through one or both eyes.',
    incorrectText: 'Sudden blurred vision or difficulty seeing can be a warning sign of stroke.',
    successText: 'You correctly identified that sudden trouble seeing can need urgent medical attention.'
  },
  {
    icon: 'F',
    title: 'FACE DROOPING',
    text: 'Sudden weakness or numbness of the face. Is the face uneven?',
    video: 'media/weakness on face.mp4',
    question: "Mr Rajesh's face appears uneven on one sided.",
    incorrectText: 'This situation needs immediate medical attention. Drooping on one side of the face can be a sign of stroke. Call Doctor or reach the nearest hospital immediately.',
    successText: 'You correctly identified that face drooping can be a sign of stroke.'
  },
  {
    icon: 'A',
    title: 'ARMS PAIN',
    text: 'Sudden weakness, numbness or pain in one or both arms',
    video: 'media/arm pain.mp4',
    question: 'Mr Raj noticed weakness, numbness or pain in one arm this morning',
    incorrectText: 'Sudden weakness, numbness or pain in one arm can be a warning sign of stroke.',
    successText: 'You correctly identified that sudden arm weakness, numbness or pain can need urgent medical attention.'
  },
  {
    icon: 'S',
    title: 'INABILITY TO SPEAK',
    text: 'Sudden trouble speaking or understanding speech',
    video: 'media/uneven speak.mp4',
    question: 'Mrs Sandhya suddenly experienced difficulty in speaking or understanding what others were saying.',
    incorrectText: 'Sudden difficulty speaking or understanding others may be a sign of stroke.',
    successText: 'You correctly identified that sudden difficulty speaking or understanding others can be a sign of stroke.'
  }
];

// ===== AOS Init =====
function initAOS() {
  if (!window.AOS) return;

  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50
  });
}

initAOS();
window.addEventListener('load', initAOS, { once: true });

// ===== Element Selectors =====
const quizVideo = document.getElementById('quizVideo');
const quizVideoSource = document.getElementById('quizVideoSource');
const levelBadge = document.getElementById('levelBadge');
const progressBarFill = document.getElementById('progressBarFill');
const stepDots = document.querySelectorAll('.step-dot');
const symptomIcon = document.getElementById('symptomIcon');
const symptomTitle = document.getElementById('symptomTitle');
const symptomText = document.getElementById('symptomText');
const questionTitle = document.getElementById('questionTitle');
const btnAllGood = document.getElementById('btnAllGood');
const btnMedicalAttention = document.getElementById('btnMedicalAttention');
const feedbackModal = document.getElementById('feedbackModal');
const modalIcon = document.getElementById('modalIcon');
const beaconIcon = document.getElementById('beaconIcon');
const modalIconGlyph = modalIcon.querySelector('i');
const modalShieldIcon = document.querySelector('.modal-shield i');
const modalCharacterImg = document.querySelector('.modal-character-img'); // Naya selector add kiya hai
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const nextLevelText = nextLevelBtn.querySelector('.btn-text');

let currentLevelIndex = 0;
let isAnswered = false;
let videoUnlockBound = false;

// ===== Render Current Question =====
function renderLevel(index) {
  const level = quizLevels[index];

  currentLevelIndex = index;
  isAnswered = false;

  levelBadge.innerText = `Level ${index + 1} of ${quizLevels.length}`;
  progressBarFill.style.width = `${((index + 1) / quizLevels.length) * 100}%`;
  stepDots.forEach((dot, dotIndex) => {
    dot.classList.toggle('active', dotIndex === index);
    dot.classList.toggle('completed', dotIndex < index);
  });
  symptomIcon.innerText = level.icon;
  symptomTitle.innerText = level.title;
  symptomText.innerText = level.text;
  questionTitle.innerText = level.question;

  loadQuestionVideo(level.video);

  nextLevelText.innerText = index === quizLevels.length - 1 ? 'Finish' : 'Next Level';
}

function loadQuestionVideo(videoSrc) {
  quizVideo.pause();
  quizVideo.autoplay = true;
  quizVideo.loop = true;
  quizVideo.muted = false;
  quizVideo.defaultMuted = false;
  quizVideo.volume = 1;
  quizVideo.setAttribute('autoplay', '');
  quizVideo.setAttribute('loop', '');
  quizVideo.setAttribute('playsinline', '');
  quizVideo.removeAttribute('muted');

  if (quizVideoSource) {
    quizVideoSource.src = videoSrc;
    quizVideo.removeAttribute('src');
  } else {
    quizVideo.src = videoSrc;
  }

  quizVideo.load();
  quizVideo.addEventListener('canplay', playQuizVideo, { once: true });
  playQuizVideo();
}

function playQuizVideo() {
  const playPromise = quizVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      console.log('Autoplay prevented:', e);
      bindVideoUnlock();
    });
  }
}

function bindVideoUnlock() {
  if (videoUnlockBound) return;
  videoUnlockBound = true;

  const unlockVideo = () => {
    quizVideo.muted = false;
    quizVideo.volume = 1;
    playQuizVideo();
    videoUnlockBound = false;
  };

  document.addEventListener('pointerdown', unlockVideo, { once: true, capture: true });
  document.addEventListener('keydown', unlockVideo, { once: true, capture: true });
}

// ===== Autoplay Video on DOM Ready =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => renderLevel(0), { once: true });
} else {
  renderLevel(0);
}

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

  const level = quizLevels[currentLevelIndex];

  quizVideo.pause();
  quizVideo.removeAttribute('loop');
  showModal('error', 'Incorrect Choice!', level.incorrectText);
});

btnMedicalAttention.addEventListener('click', () => {
  if (isAnswered) return;
  isAnswered = true;

  quizVideo.pause();
  quizVideo.removeAttribute('loop');
  showModal('success', 'Absolutely Right!', quizLevels[currentLevelIndex].successText);
});

// ===== Modal Controls =====
function showModal(type, title, text) {
  const isSuccess = type === 'success';
  const iconClass = isSuccess ? 'fa-check' : 'fa-xmark';

  feedbackModal.classList.remove('modal-success', 'modal-error');
  feedbackModal.classList.add(isSuccess ? 'modal-success' : 'modal-error');
  modalIconGlyph.className = `fas ${iconClass}`;
  modalShieldIcon.className = `fas ${iconClass}`;
  
  // 1 & 2: Title ke right side wale icon ko hide kar diya (flex se none karke)
  modalIcon.style.display = 'none'; 
  beaconIcon.style.display = 'block';

  // 3: Popup image change karne ki condition
  if (isSuccess) {
    modalCharacterImg.src = 'media/popup_correct.png';
  } else {
    modalCharacterImg.src = 'media/popup.png';
  }

  modalTitle.innerText = title;
  modalText.innerText = text;
  feedbackModal.classList.add('show');
}

nextLevelBtn.addEventListener('click', () => {
  feedbackModal.classList.remove('show');

  setTimeout(() => {
    feedbackModal.classList.remove('modal-success', 'modal-error');

    const nextIndex = currentLevelIndex + 1;
    if (nextIndex < quizLevels.length) {
      renderLevel(nextIndex);
      return;
    }

    window.location.href = 'thanks.html';
  }, 300);
});
