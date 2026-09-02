// ===== Quiz Data =====
const quizLevels = [
  {
    icon: 'B',
    title: 'BALANCE LOSS',
    text: 'Sudden loss of balance, dizziness or coordination',
    video: 'media/balance.mp4',
    optionsVideo: 'media/stopwatch_sample.mp4',
    optionsVideoDelayMs: 1000,
    autoAdvanceAfterOptionsVideo: true,
    questionLead: 'Mr. Ramesh suddenly experienced ',
    questionEmphasis: 'loss of balance, dizziness or difficulty coordinating his movements.',
    incorrectText: 'Sudden loss of balance or poor coordination, dizziness or trouble in walking can be a warning sign of stroke. Look for urgent medical attention',
    successText: 'Sudden loss of balance or poor coordination, dizziness or trouble in walking can be a warning sign of stroke.'
  },
  {
    icon: 'E',
    title: 'Eye (Vision) Changes',
    text: 'Sudden trouble seeing in one or both eyes',
    video: 'media/trouble in seeing.mp4',
    muted: true,
    optionsVideo: 'media/stopwatch_sample.mp4',
    autoAdvanceAfterOptionsVideo: true,
    questionLead: 'Mrs. Meena suddenly experienced ',
    questionEmphasis: 'blurred or double vision, or difficulty seeing',
    questionTail: ' through one or both eyes.',
    incorrectText: 'Sudden blurred/double vision or difficulty seeing can be a warning sign of stroke. Look for urgent medical attention',
    successText: 'Sudden blurred or double vision, or difficulty seeing in one or both eyes can be a warning sign of stroke.'
  },
  {
    icon: 'F',
    title: 'FACE DROOPING',
    text: 'Sudden weakness or numbness of the face or uneven face.',
    video: 'media/weakness on face.mp4',
    optionsVideo: 'media/stopwatch_sample.mp4',
    autoAdvanceAfterOptionsVideo: true,
    questionLead: "Mr. Rajesh face appears ",
    questionEmphasis: 'uneven on one sided.',
    incorrectText: 'Drooping downward on one side of the face can be a sign of stroke. Look for urgent medical attention',
    successText: 'Sudden drooping or weakness on one side of the face can be a warning sign of stroke.'
  },
  {
    icon: 'A',
    title: 'ARM WEAKNESS',
    text: 'Sudden weakness numbness in one or both arms',
    video: 'media/arm pain.mp4',
    optionsVideo: 'media/stopwatch_sample.mp4',
    autoAdvanceAfterOptionsVideo: true,
    questionLead: 'Mr. Raj noticed ',
    questionEmphasis: 'weakness or numbness in one arm this morning.',
    incorrectText: 'Sudden weakness or numbness in one arm can be a warning sign of stroke. Look for urgent medical attention',
    successText: 'Sudden weakness or numbness in one arm can be a warning sign of stroke.'
  },
  {
    icon: 'S',
    title: 'SPEECH DIFFICULTY',
    text: 'Difficulty in Speaking or slurring of speech',
    video: 'media/uneven speak.mp4',
    questionVideoMuted: false,
    timerAudioVolume: 0.5,
    optionsVideo: 'media/stopwatch_sample.mp4',
    autoAdvanceAfterOptionsVideo: true,
    questionLead: 'Mrs. Sandhya suddenly experienced ',
    questionEmphasis: 'difficulty speaking or slurred speech.',
    incorrectText: 'Sudden trouble in speaking or understanding speech may be a sign of stroke. Look for urgent medical attention',
    successText: 'Sudden difficulty speaking, slurred speech or trouble understanding speech can be a warning sign of stroke.'
  },
  {
    type: 'emergency',
    icon: 'T',
    title: 'TIME TO CALL EMERGENCY SERVICE',
    text: '',
    image: 'media/emergency.png',
    prompt: 'Act fast',
    question: 'Time is Gold.\nCall emergency services immediately.',
    message: 'Every minute matters. Recognize even one sign of stroke and call 112/108 immediately. The sooner treatment begins, the greater the chance of survival and the lower the risk of lasting disability.'
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
const questionCard = questionTitle.closest('.question-card');
const characterOptions = document.getElementById('characterOptions');
const optionsStopwatchVideo = document.getElementById('optionsStopwatchVideo');
const timerAudio = document.getElementById('timerAudio');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const modalBefastItems = document.querySelectorAll('.modal-befast-item');
const promptBannerText = document.querySelector('.options-prompt-banner span');
const emergencyImage = document.getElementById('emergencyImage');
const emergencyMessageCard = document.getElementById('emergencyMessageCard');
const emergencyMessageText = document.getElementById('emergencyMessageText');
const finishEmergencyBtn = document.getElementById('finishEmergencyBtn');
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
let currentVideoMuted = false;
let optionsVideoStartTimer = null;
let optionsVideoUnlockBound = false;
let timerAudioUnlockBound = false;
const OPTIONS_VIDEO_PLAYBACK_RATE = 0.35;
const TIMER_AUDIO_PLAYBACK_RATE = 1;
const totalSteps = quizLevels.length;

// ===== Render Current Question =====
function renderLevel(index) {
  const level = quizLevels[index];
  const isEmergencyLevel = level.type === 'emergency';

  currentLevelIndex = index;
  isAnswered = false;
  document.body.classList.toggle('emergency-active', isEmergencyLevel);

  levelBadge.innerText = `Level ${index + 1} of ${totalSteps}`;
  progressBarFill.style.width = `${((index + 1) / totalSteps) * 100}%`;
  stepDots.forEach((dot, dotIndex) => {
    dot.classList.toggle('active', dotIndex === index);
    dot.classList.toggle('completed', dotIndex < index);
  });
  symptomIcon.innerText = level.icon;
  symptomTitle.innerText = level.title;
  symptomText.innerText = level.text;
  renderQuestion(level);
  questionCard.hidden = false;
  if (characterOptions) characterOptions.hidden = isEmergencyLevel;
  renderOptionsMedia(level, index, isEmergencyLevel);
  emergencyMessageCard.hidden = !isEmergencyLevel;
  finishEmergencyBtn.hidden = !isEmergencyLevel;
  promptBannerText.innerHTML = level.prompt ? level.prompt : 'Need Urgent<br />Medical Attention?';

  if (isEmergencyLevel) {
    loadEmergencyImage(level.image);
  } else {
    emergencyImage.hidden = true;
    quizVideo.hidden = false;
    loadQuestionVideo(level.video, level.questionVideoMuted !== false);
  }

  nextLevelText.innerText = 'Next Level';

  if (window.refreshGoogleWebsiteTranslation) {
    window.refreshGoogleWebsiteTranslation();
  }
}

function renderQuestion(level) {
  questionTitle.replaceChildren();

  if (level.questionLead || level.questionEmphasis) {
    questionTitle.append(document.createTextNode(level.questionLead || ''));

    if (level.questionEmphasis) {
      const emphasis = document.createElement('strong');
      emphasis.textContent = level.questionEmphasis;
      questionTitle.append(emphasis);
    }

    if (level.questionTail) {
      questionTitle.append(document.createTextNode(level.questionTail));
    }
    return;
  }

  questionTitle.textContent = level.question || '';
}

function renderOptionsMedia(level, index, isEmergencyLevel) {
  stopOptionsVideoPlayback();

  const showStopwatchVideo = !isEmergencyLevel && Boolean(level.optionsVideo);
  characterOptions.classList.toggle('stopwatch-options-active', showStopwatchVideo);
  optionsStopwatchVideo.hidden = !showStopwatchVideo;

  if (!showStopwatchVideo) return;

  optionsStopwatchVideo.src = level.optionsVideo;
  optionsStopwatchVideo.loop = false;
  optionsStopwatchVideo.muted = true;
  optionsStopwatchVideo.defaultMuted = true;
  optionsStopwatchVideo.volume = 0;
  optionsStopwatchVideo.setAttribute('muted', '');
  optionsStopwatchVideo.defaultPlaybackRate = OPTIONS_VIDEO_PLAYBACK_RATE;
  optionsStopwatchVideo.playbackRate = OPTIONS_VIDEO_PLAYBACK_RATE;
  optionsStopwatchVideo.currentTime = 0;
  optionsStopwatchVideo.load();

  const delayMs = Number.isFinite(level.optionsVideoDelayMs) ? level.optionsVideoDelayMs : 1000;
  optionsVideoStartTimer = window.setTimeout(() => {
    optionsVideoStartTimer = null;
    if (currentLevelIndex !== index || isAnswered || optionsStopwatchVideo.hidden) return;
    playOptionsVideo();
  }, delayMs);
}

function playOptionsVideo() {
  optionsStopwatchVideo.muted = true;
  optionsStopwatchVideo.defaultMuted = true;
  optionsStopwatchVideo.volume = 0;
  optionsStopwatchVideo.playbackRate = OPTIONS_VIDEO_PLAYBACK_RATE;

  const playPromise = optionsStopwatchVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log('Muted stopwatch autoplay was prevented:', error);
      bindOptionsVideoUnlock();
    });
  }
}

function bindOptionsVideoUnlock() {
  if (optionsVideoUnlockBound) return;
  optionsVideoUnlockBound = true;
  document.addEventListener('pointerdown', unlockOptionsVideoPlayback, { once: true, capture: true });
  document.addEventListener('keydown', unlockOptionsVideoPlayback, { once: true, capture: true });
}

function unlockOptionsVideoPlayback() {
  optionsVideoUnlockBound = false;
  if (isAnswered || optionsStopwatchVideo.hidden) return;
  playOptionsVideo();
}

function stopOptionsVideoPlayback(resetTime = true) {
  if (optionsVideoStartTimer !== null) {
    window.clearTimeout(optionsVideoStartTimer);
    optionsVideoStartTimer = null;
  }

  document.removeEventListener('pointerdown', unlockOptionsVideoPlayback, true);
  document.removeEventListener('keydown', unlockOptionsVideoPlayback, true);
  document.removeEventListener('pointerdown', unlockTimerAudioPlayback, true);
  document.removeEventListener('keydown', unlockTimerAudioPlayback, true);
  optionsVideoUnlockBound = false;
  timerAudioUnlockBound = false;
  optionsStopwatchVideo.pause();
  stopTimerAudio();

  if (resetTime) optionsStopwatchVideo.currentTime = 0;
}

function handleOptionsVideoEnded() {
  stopTimerAudio();
  const level = quizLevels[currentLevelIndex];
  if (!level || !level.autoAdvanceAfterOptionsVideo || isAnswered) return;

  const nextIndex = currentLevelIndex + 1;
  if (nextIndex < quizLevels.length) renderLevel(nextIndex);
}

optionsStopwatchVideo.addEventListener('ended', handleOptionsVideoEnded);
optionsStopwatchVideo.addEventListener('play', startTimerAudio);
optionsStopwatchVideo.addEventListener('pause', stopTimerAudio);

function startTimerAudio() {
  if (!timerAudio || isAnswered || optionsStopwatchVideo.hidden) return;

  const level = quizLevels[currentLevelIndex];
  const requestedVolume = Number.isFinite(level?.timerAudioVolume) ? level.timerAudioVolume : 1;
  timerAudio.loop = true;
  timerAudio.defaultPlaybackRate = TIMER_AUDIO_PLAYBACK_RATE;
  timerAudio.playbackRate = TIMER_AUDIO_PLAYBACK_RATE;
  timerAudio.volume = Math.min(1, Math.max(0, requestedVolume));
  timerAudio.currentTime = 0;

  const playPromise = timerAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log('Timer audio autoplay was prevented:', error);
      bindTimerAudioUnlock();
    });
  }
}

function stopTimerAudio() {
  if (!timerAudio) return;
  timerAudio.pause();
  timerAudio.currentTime = 0;
}

function bindTimerAudioUnlock() {
  if (timerAudioUnlockBound) return;
  timerAudioUnlockBound = true;
  document.addEventListener('pointerdown', unlockTimerAudioPlayback, { once: true, capture: true });
  document.addEventListener('keydown', unlockTimerAudioPlayback, { once: true, capture: true });
}

function unlockTimerAudioPlayback() {
  timerAudioUnlockBound = false;
  if (isAnswered || optionsStopwatchVideo.hidden || optionsStopwatchVideo.paused || optionsStopwatchVideo.ended) return;
  startTimerAudio();
}

function loadEmergencyImage(imageSrc) {
  quizVideo.pause();
  quizVideo.hidden = true;
  quizVideo.removeAttribute('loop');
  currentVideoMuted = false;
  if (emergencyImage) {
    emergencyImage.src = imageSrc;
    emergencyImage.hidden = false;
  }
}

function loadQuestionVideo(videoSrc, shouldMute = true) {
  quizVideo.pause();
  currentVideoMuted = shouldMute;
  quizVideo.autoplay = true;
  quizVideo.loop = true;
  quizVideo.muted = shouldMute;
  quizVideo.defaultMuted = shouldMute;
  quizVideo.volume = shouldMute ? 0 : 1;
  quizVideo.setAttribute('autoplay', '');
  quizVideo.setAttribute('loop', '');
  quizVideo.setAttribute('playsinline', '');
  if (shouldMute) {
    quizVideo.setAttribute('muted', '');
  } else {
    quizVideo.removeAttribute('muted');
  }

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
    quizVideo.muted = currentVideoMuted;
    quizVideo.volume = currentVideoMuted ? 0 : 1;
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

// ===== Click Handlers for Superhero Dialogue Options =====
if (btnYes) {
  btnYes.addEventListener('click', () => {
    if (isAnswered) return;
    if (quizLevels[currentLevelIndex].type === 'emergency') return;
    isAnswered = true;
    stopOptionsVideoPlayback(false);

    quizVideo.pause();
    quizVideo.removeAttribute('loop');
    // Yes -> Correct choice (stroke symptoms need urgent medical attention)
    showModal('success', 'Absolutely Right!', quizLevels[currentLevelIndex].successText);
  });
}

if (btnNo) {
  btnNo.addEventListener('click', () => {
    if (isAnswered) return;
    if (quizLevels[currentLevelIndex].type === 'emergency') return;
    isAnswered = true;
    stopOptionsVideoPlayback(false);

    const level = quizLevels[currentLevelIndex];
    quizVideo.pause();
    quizVideo.removeAttribute('loop');
    // No -> Incorrect choice (stroke symptoms must not be ignored)
    showModal('error', 'Incorrect Choice!', level.incorrectText);
  });
}

// ===== Modal Controls =====
function showModal(type, title, text) {
  const isSuccess = type === 'success';
  const iconClass = isSuccess ? 'fa-check' : 'fa-xmark';

  if (feedbackModal) {
    feedbackModal.classList.remove('modal-success', 'modal-error');
    feedbackModal.classList.add(isSuccess ? 'modal-success' : 'modal-error');
  }

  const glyph = modalIcon ? modalIcon.querySelector('i') : null;
  if (glyph) glyph.className = `fas ${iconClass}`;

  const shield = document.querySelector('.modal-shield i');
  if (shield) shield.className = `fas ${iconClass}`;
  
  if (modalIcon) modalIcon.style.display = 'none'; 
  if (beaconIcon) beaconIcon.style.display = 'block';

  const charImg = document.querySelector('.modal-character-img');
  if (charImg) {
    charImg.src = isSuccess ? 'media/clock.png' : 'media/popup.png';
  }

  // Highlight the active BEFAST sign for current question level
  modalBefastItems.forEach((item, idx) => {
    const isActiveSign = idx === currentLevelIndex;
    item.classList.toggle('active', isActiveSign);

    if (isActiveSign) {
      item.setAttribute('aria-current', 'true');
    } else {
      item.removeAttribute('aria-current');
    }
  });

  if (modalTitle) modalTitle.innerText = title || '';
  if (modalText) modalText.innerText = text || '';
  if (feedbackModal) feedbackModal.classList.add('show');

  if (window.refreshGoogleWebsiteTranslation) {
    window.refreshGoogleWebsiteTranslation();
  }
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
