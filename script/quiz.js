// ===== Quiz Data =====
const quizLevels = [
  {
    icon: 'B',
    title: 'BALANCE LOSS',
    text: 'Sudden loss of balance, dizziness or coordination',
    video: 'media/balance.mp4',
    followupVideo: 'media/balance_2.mp4',
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
AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50
});

// ===== Element Selectors =====
const quizVideo = document.getElementById('quizVideo');
const levelBadge = document.getElementById('levelBadge');
const progressBarFill = document.getElementById('progressBarFill');
const symptomIcon = document.getElementById('symptomIcon');
const symptomTitle = document.getElementById('symptomTitle');
const symptomText = document.getElementById('symptomText');
const questionTitle = document.getElementById('questionTitle');
const btnAllGood = document.getElementById('btnAllGood');
const btnMedicalAttention = document.getElementById('btnMedicalAttention');
const feedbackModal = document.getElementById('feedbackModal');
const modalIcon = document.getElementById('modalIcon');
const beaconIcon = document.getElementById('beaconIcon');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const nextLevelText = nextLevelBtn.querySelector('.btn-text');

let currentLevelIndex = 0;
let isAnswered = false;
let waitingForFollowupVideo = false;

// ===== Render Current Question =====
function renderLevel(index) {
  const level = quizLevels[index];

  currentLevelIndex = index;
  isAnswered = false;
  waitingForFollowupVideo = false;

  levelBadge.innerText = `Level ${index + 1} of ${quizLevels.length}`;
  progressBarFill.style.width = `${((index + 1) / quizLevels.length) * 100}%`;
  symptomIcon.innerText = level.icon;
  symptomTitle.innerText = level.title;
  symptomText.innerText = level.text;
  questionTitle.innerText = level.question;

  quizVideo.pause();
  quizVideo.muted = false;
  quizVideo.volume = 1;
  quizVideo.loop = true;
  quizVideo.src = level.video;
  quizVideo.load();
  playQuizVideo();

  nextLevelText.innerText = index === quizLevels.length - 1 ? 'Finish' : 'Next Level';
}

function playQuizVideo() {
  const playPromise = quizVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => console.log('Autoplay prevented:', e));
  }
}

// ===== Autoplay Video on Load =====
window.addEventListener('load', () => {
  renderLevel(0);

  quizVideo.addEventListener('ended', () => {
    if (!waitingForFollowupVideo) return;

    waitingForFollowupVideo = false;
    showModal('error', 'Incorrect Choice!', quizLevels[currentLevelIndex].incorrectText);
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

  const level = quizLevels[currentLevelIndex];

  if (level.followupVideo) {
    quizVideo.pause();
    quizVideo.loop = false;
    quizVideo.src = level.followupVideo;
    quizVideo.load();
    waitingForFollowupVideo = true;
    playQuizVideo();
    return;
  }

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

  setTimeout(() => {
    const nextIndex = currentLevelIndex + 1;
    if (nextIndex < quizLevels.length) {
      renderLevel(nextIndex);
      return;
    }

    window.location.href = 'certificate.html';
  }, 300);
});
