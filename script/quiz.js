// ===== Quiz Data =====
const quizLevels = [
  {
    translationKey: 'quiz.levels.balance',
    icon: 'B',
    title: 'BALANCE LOSS',
    text: 'Sudden loss of balance, dizziness or coordination',
    video: 'media/balance.mp4',
    poster: 'media/balance_poster.png',
    optionsVideo: 'media/stopwatch_sample.mp4',
    optionsVideoDelayMs: 1000,
    autoAdvanceAfterOptionsVideo: true,
    questionLead: 'Mr. A suddenly experienced ',
    questionEmphasis: 'loss of balance, dizziness or difficulty coordinating his movements.',
    incorrectText: 'Sudden loss of balance or poor coordination, dizziness or trouble in walking can be a warning sign of stroke. Look for urgent medical attention',
    successText: 'Sudden loss of balance or poor coordination, dizziness or trouble in walking can be a warning sign of stroke.'
  },
  {
    translationKey: 'quiz.levels.eye',
    icon: 'E',
    title: 'Eye (Vision) Changes',
    text: 'Sudden trouble seeing in one or both eyes',
    video: 'media/trouble in seeing.mp4',
    poster: 'media/seeing_poster.png',
    muted: true,
    optionsVideo: 'media/stopwatch_sample.mp4',
    autoAdvanceAfterOptionsVideo: true,
    questionLead: 'Mrs. B suddenly experienced ',
    questionEmphasis: 'blurred or double vision, or difficulty seeing',
    questionTail: ' through one or both eyes.',
    incorrectText: 'Sudden blurred/double vision or difficulty seeing can be a warning sign of stroke. Look for urgent medical attention',
    successText: 'Sudden blurred or double vision, or difficulty seeing in one or both eyes can be a warning sign of stroke.'
  },
  {
    translationKey: 'quiz.levels.face',
    icon: 'F',
    title: 'FACE DROOPING',
    text: 'Sudden weakness or numbness of the face or uneven face.',
    video: 'media/weakness on face.mp4',
    poster: 'media/face_poster.png',
    optionsVideo: 'media/stopwatch_sample.mp4',
    autoAdvanceAfterOptionsVideo: true,
    questionLead: "Mr. X face appears ",
    questionEmphasis: 'uneven on one sided.',
    incorrectText: 'Drooping downward on one side of the face can be a sign of stroke. Look for urgent medical attention',
    successText: 'Sudden drooping or weakness on one side of the face can be a warning sign of stroke.'
  },
  {
    translationKey: 'quiz.levels.arm',
    icon: 'A',
    title: 'ARM WEAKNESS',
    text: 'Sudden weakness numbness in one or both arms',
    video: 'media/arm pain.mp4',
    poster: 'media/arm_poster.png',
    optionsVideo: 'media/stopwatch_sample.mp4',
    autoAdvanceAfterOptionsVideo: true,
    questionLead: 'Mr. Y noticed ',
    questionEmphasis: 'weakness or numbness in the arms this morning.',
    incorrectText: 'Sudden weakness or numbness in one arm can be a warning sign of stroke. Look for urgent medical attention',
    successText: 'Sudden weakness or numbness in one arm can be a warning sign of stroke.'
  },
  {
    translationKey: 'quiz.levels.speech',
    icon: 'S',
    title: 'SPEECH DIFFICULTY',
    text: 'Difficulty in Speaking or slurring of speech',
    video: 'media/uneven speak.mp4',
    poster: 'media/speak_poster.png',
    questionVideoMuted: false,
    timerAudioVolume: 0.5,
    optionsVideo: 'media/stopwatch_sample.mp4',
    autoAdvanceAfterOptionsVideo: true,
    questionLead: 'Mrs. A suddenly experienced ',
    questionEmphasis: 'difficulty speaking or slurred speech.',
    incorrectText: 'Sudden trouble in speaking or understanding speech may be a sign of stroke. Look for urgent medical attention',
    successText: 'Sudden difficulty speaking, slurred speech or trouble understanding speech can be a warning sign of stroke.',
    subtitles: [
      { start: 0.0, end: 5.5, text: "I won, won, won, won't go." },
      { start: 5.5, end: 7.5, text: 'Can you understand what I am saying?' },
      { start: 7.5, end: 10.5, text: 'Hi, hi, he...' }
    ]
  },
  {
    translationKey: 'quiz.levels.emergency',
    type: 'emergency',
    icon: 'T',
    title: 'TIME TO CALL EMERGENCY SERVICE',
    text: '',
    image: 'media/emergency.png',
    prompt: 'Act fast',
    question: 'The Golden hour (first 60 mins) after a stroke is the most critical window to start emergency treatment to prevent brain damage & save lives. If you come across any single or multiple warning signs of stroke. Call emergency services immediately',
    message: 'Every minute matters. Recognize even one sign of stroke and get Immediate Medical Help. The sooner treatment begins, the greater is the chance of survival and the lower is the risk of lasting disability.'
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
const quizVideoPoster = document.getElementById('quizVideoPoster');
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
const promptBanner = document.querySelector('.options-prompt-banner');
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
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
const videoSubtitleOverlay = document.getElementById('videoSubtitleOverlay');
const videoSubtitleText = document.getElementById('videoSubtitleText');
const quizGameIntroModal = document.getElementById('quizGameIntroModal');
const quizConfirmPlayBtn = document.getElementById('quizConfirmPlayBtn');

let currentLevelIndex = 0;
let isAnswered = false;
let currentLevelSubtitles = null;
let videoUnlockBound = false;
let currentVideoMuted = false;
let currentQuestionVideoSrc = '';
let optionsVideoStartTimer = null;
let optionsVideoUnlockBound = false;
let timerAudioUnlockBound = false;
const OPTIONS_VIDEO_PLAYBACK_RATE = 0.35;

const preloadedVideoElements = new Map();
const preloadedAssetUrls = new Set();

function preloadAsset(url, type = 'video') {
  if (!url || preloadedAssetUrls.has(url)) return;
  preloadedAssetUrls.add(url);

  if (type === 'video') {
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    v.load();
    preloadedVideoElements.set(url, v);
  } else if (type === 'image') {
    const img = new Image();
    img.src = url;
  }
}

function preloadNextLevelAssets(targetIndex) {
  if (targetIndex < 0 || targetIndex >= quizLevels.length) return;
  const level = quizLevels[targetIndex];
  if (!level) return;

  if (level.poster) {
    preloadAsset(level.poster, 'image');
  }
  if (level.video) {
    preloadAsset(level.video, 'video');
  }
  if (level.image) {
    preloadAsset(level.image, 'image');
  }
}

function preloadInitialStaticAssets() {
  [
    'media/balance_poster.png',
    'media/seeing_poster.png',
    'media/face_poster.png',
    'media/arm_poster.png',
    'media/speak_poster.png',
    'media/stopwatch_poster.png',
    'media/clock.png',
    'media/popup.png',
    'media/emergency.png',
    'media/microlab.png'
  ].forEach(imgSrc => {
    preloadAsset(imgSrc, 'image');
  });
}


function initScrollToBottomButton() {
  if (!scrollToBottomBtn) return;

  const mobileMediaQuery = window.matchMedia('(max-width: 767px)');
  let updateFrame = null;

  function updateButtonVisibility() {
    updateFrame = null;

    const pageHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const remainingScroll = pageHeight - viewportHeight - scrollTop;
    const shouldShow = mobileMediaQuery.matches
      && pageHeight > viewportHeight + 24
      && remainingScroll > 24;

    scrollToBottomBtn.classList.toggle('is-hidden', !shouldShow);
    scrollToBottomBtn.tabIndex = shouldShow ? 0 : -1;
    scrollToBottomBtn.setAttribute('aria-hidden', String(!shouldShow));
  }

  function scheduleVisibilityUpdate() {
    if (updateFrame !== null) return;
    updateFrame = window.requestAnimationFrame(updateButtonVisibility);
  }

  scrollToBottomBtn.addEventListener('click', () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  });

  window.addEventListener('scroll', scheduleVisibilityUpdate, { passive: true });
  window.addEventListener('resize', scheduleVisibilityUpdate, { passive: true });
  window.addEventListener('load', scheduleVisibilityUpdate, { once: true });
  mobileMediaQuery.addEventListener('change', scheduleVisibilityUpdate);

  if (typeof ResizeObserver === 'function') {
    const pageResizeObserver = new ResizeObserver(scheduleVisibilityUpdate);
    pageResizeObserver.observe(document.body);
  }

  scheduleVisibilityUpdate();
}

initScrollToBottomButton();
const TIMER_AUDIO_PLAYBACK_RATE = 1;
const totalSteps = quizLevels.length;

function translate(key, fallback = '', replacements) {
  return window.appI18n
    ? window.appI18n.t(key, fallback, replacements)
    : fallback;
}

function getLocalizedLevel(level) {
  const localizedCopy = translate(level.translationKey, null);
  return localizedCopy && typeof localizedCopy === 'object'
    ? { ...level, ...localizedCopy }
    : level;
}

function resetQuizScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

// ===== Render Current Question =====
function renderLevel(index) {
  const level = getLocalizedLevel(quizLevels[index]);
  const isEmergencyLevel = level.type === 'emergency';

  currentLevelIndex = index;
  isAnswered = false;
  currentLevelSubtitles = Array.isArray(level.subtitles) ? level.subtitles : null;
  updateVideoSubtitles();
  document.body.classList.toggle('emergency-active', isEmergencyLevel);

  levelBadge.innerText = translate('quiz.level', 'Level {current} of {total}', {
    current: index + 1,
    total: totalSteps
  });
  progressBarFill.style.width = `${((index + 1) / totalSteps) * 100}%`;
  stepDots.forEach((dot, dotIndex) => {
    dot.classList.toggle('active', dotIndex === index);
    dot.classList.toggle('completed', dotIndex < index);
  });
  symptomIcon.innerText = level.icon;
  symptomTitle.innerText = level.title;
  symptomText.innerText = level.text;
  renderQuestion(level);

  if (questionCard) {
    questionCard.classList.remove('question-refresh');
    void questionCard.offsetWidth;
    questionCard.classList.add('question-refresh');
  }

  questionCard.hidden = false;
  if (characterOptions) characterOptions.hidden = isEmergencyLevel;
  if (promptBanner) promptBanner.hidden = isEmergencyLevel;
  renderOptionsMedia(level, index, isEmergencyLevel);
  emergencyMessageCard.hidden = !isEmergencyLevel;
  finishEmergencyBtn.hidden = !isEmergencyLevel;
  if (emergencyMessageText && level.message) {
    emergencyMessageText.textContent = level.message;
  }
  if (promptBannerText) {
    promptBannerText.innerHTML = level.prompt
      ? level.prompt
      : translate('quiz.prompt', 'Need Urgent<br />Medical Attention?');
  }

  if (isEmergencyLevel) {
    loadEmergencyImage(level.image);
  } else {
    emergencyImage.hidden = true;
    quizVideo.hidden = false;
    if (quizVideoPoster) quizVideoPoster.hidden = false;
    loadQuestionVideo(level.video, level.questionVideoMuted !== false, level.poster || '');
  }

  nextLevelText.innerText = translate('quiz.nextLevel', 'Next Level');

  resetQuizScroll();
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

  const currentStopwatchSrc = optionsStopwatchVideo.currentSrc || optionsStopwatchVideo.src || (optionsStopwatchVideo.querySelector('source')?.src || '');
  const cleanOptionsSrc = (level.optionsVideo || '').replace(/^\.?\//, '');
  const needsSourceChange = !currentStopwatchSrc || !currentStopwatchSrc.endsWith(cleanOptionsSrc);
  if (needsSourceChange) {
    optionsStopwatchVideo.src = level.optionsVideo;
  }
  optionsStopwatchVideo.loop = false;
  optionsStopwatchVideo.muted = true;
  optionsStopwatchVideo.defaultMuted = true;
  optionsStopwatchVideo.volume = 0;
  optionsStopwatchVideo.setAttribute('muted', '');
  optionsStopwatchVideo.defaultPlaybackRate = OPTIONS_VIDEO_PLAYBACK_RATE;
  optionsStopwatchVideo.playbackRate = OPTIONS_VIDEO_PLAYBACK_RATE;
  optionsStopwatchVideo.currentTime = 0;
  if (needsSourceChange) {
    optionsStopwatchVideo.load();
  }

  const delayMs = Number.isFinite(level.optionsVideoDelayMs) ? level.optionsVideoDelayMs : 250;
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
  currentQuestionVideoSrc = '';
  currentLevelSubtitles = null;
  updateVideoSubtitles();
  quizVideo.pause();
  quizVideo.hidden = true;
  quizVideo.removeAttribute('loop');
  quizVideo.classList.remove('is-switching');
  if (quizVideoPoster) {
    quizVideoPoster.classList.remove('is-active');
    quizVideoPoster.hidden = true;
  }
  currentVideoMuted = false;
  if (emergencyImage) {
    emergencyImage.src = imageSrc;
    emergencyImage.hidden = false;
  }
}

function isSameVideoSource(videoElement, sourceElement, targetSrc) {
  if (!targetSrc) return false;
  const cleanTarget = targetSrc.replace(/^\.?\//, '');
  const elementSrc = (videoElement.src || '').replace(/^\.?\//, '');
  const currentSrc = (videoElement.currentSrc || '').replace(/^\.?\//, '');
  const sourceSrc = (sourceElement?.src || '').replace(/^\.?\//, '');

  return (
    elementSrc.endsWith(cleanTarget) ||
    currentSrc.endsWith(cleanTarget) ||
    sourceSrc.endsWith(cleanTarget)
  );
}

function loadQuestionVideo(videoSrc, shouldMute = true, posterSrc = '') {
  const isAlreadyLoadedSource = isSameVideoSource(quizVideo, quizVideoSource, videoSrc);

  if (currentQuestionVideoSrc === videoSrc && isAlreadyLoadedSource) {
    if (quizVideoPoster) {
      quizVideoPoster.classList.remove('is-active');
    }
    quizVideo.currentTime = 0;
    playQuizVideo();
    preloadNextLevelAssets(currentLevelIndex + 1);
    return;
  }

  currentQuestionVideoSrc = videoSrc;
  currentVideoMuted = shouldMute;

  if (quizVideoPoster && posterSrc) {
    quizVideoPoster.hidden = false;
    quizVideoPoster.src = posterSrc;
    quizVideoPoster.classList.add('is-active');
  }

  if (posterSrc) {
    quizVideo.poster = posterSrc;
  }

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

  if (isAlreadyLoadedSource) {
    quizVideo.classList.remove('is-switching');
    if (quizVideo.readyState >= 2) {
      if (quizVideoPoster) quizVideoPoster.classList.remove('is-active');
      playQuizVideo();
    } else {
      const onInitialReady = () => {
        quizVideo.removeEventListener('loadeddata', onInitialReady);
        quizVideo.removeEventListener('canplay', onInitialReady);
        quizVideo.removeEventListener('playing', onInitialReady);
        if (quizVideoPoster) quizVideoPoster.classList.remove('is-active');
        playQuizVideo();
      };
      quizVideo.addEventListener('loadeddata', onInitialReady, { once: true });
      quizVideo.addEventListener('canplay', onInitialReady, { once: true });
      quizVideo.addEventListener('playing', onInitialReady, { once: true });
    }
    setTimeout(() => {
      preloadNextLevelAssets(currentLevelIndex + 1);
    }, 600);
    return;
  }

  if (quizVideoSource) {
    quizVideoSource.src = videoSrc;
  }
  quizVideo.src = videoSrc;

  let readyHandled = false;
  const onVideoReady = () => {
    if (readyHandled) return;
    readyHandled = true;
    quizVideo.removeEventListener('loadeddata', onVideoReady);
    quizVideo.removeEventListener('canplay', onVideoReady);
    quizVideo.removeEventListener('playing', onVideoReady);
    quizVideo.removeEventListener('timeupdate', onVideoReady);
    quizVideo.classList.remove('is-switching');
    if (quizVideoPoster) {
      quizVideoPoster.classList.remove('is-active');
    }
    playQuizVideo();
    setTimeout(() => {
      preloadNextLevelAssets(currentLevelIndex + 1);
    }, 400);
  };

  quizVideo.addEventListener('playing', onVideoReady, { once: true });
  quizVideo.addEventListener('timeupdate', onVideoReady, { once: true });
  quizVideo.addEventListener('canplay', () => {
    if (!quizVideo.paused && quizVideo.currentTime > 0) {
      onVideoReady();
    }
  });

  quizVideo.load();
  playQuizVideo();

  setTimeout(() => {
    if (!readyHandled && quizVideo.readyState >= 2) {
      onVideoReady();
    }
  }, 1000);
}

function playQuizVideo() {
  const playPromise = quizVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      if (e && e.name === 'AbortError') return;
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

// ===== Video Subtitles Management =====
function updateVideoSubtitles() {
  if (!videoSubtitleOverlay || !videoSubtitleText) return;

  if (
    !currentLevelSubtitles ||
    !currentLevelSubtitles.length ||
    quizVideo.hidden ||
    document.body.classList.contains('emergency-active') ||
    (feedbackModal && feedbackModal.classList.contains('show'))
  ) {
    videoSubtitleOverlay.hidden = true;
    return;
  }

  const currentTime = quizVideo.currentTime || 0;
  const activeCue = currentLevelSubtitles.find(
    cue => currentTime >= cue.start && currentTime < cue.end
  );

  if (activeCue && activeCue.text) {
    if (videoSubtitleText.textContent !== activeCue.text) {
      videoSubtitleText.textContent = activeCue.text;
    }
    videoSubtitleOverlay.hidden = false;
  } else {
    videoSubtitleOverlay.hidden = true;
  }
}

quizVideo.addEventListener('timeupdate', updateVideoSubtitles);
quizVideo.addEventListener('seeking', updateVideoSubtitles);
quizVideo.addEventListener('seeked', updateVideoSubtitles);
quizVideo.addEventListener('play', updateVideoSubtitles);
quizVideo.addEventListener('pause', updateVideoSubtitles);

window.addEventListener('app-language-change', () => {
  const level = getLocalizedLevel(quizLevels[currentLevelIndex]);
  currentLevelSubtitles = Array.isArray(level.subtitles) ? level.subtitles : null;
  updateVideoSubtitles();
});

async function startQuizPage() {
  if (window.appI18n) await window.appI18n.ready;
  preloadInitialStaticAssets();

  let introSeen = false;
  try {
    introSeen = sessionStorage.getItem('gameIntroSeen') === 'true';
  } catch (e) {}

  if (introSeen || !quizGameIntroModal) {
    renderLevel(0);
    document.documentElement.classList.remove('quiz-initializing');
    return;
  }

  // Pre-render Level 0 visuals but keep stopwatch video and audio held back until user begins
  renderLevel(0);
  stopOptionsVideoPlayback();

  quizGameIntroModal.classList.add('show');
  quizGameIntroModal.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.remove('quiz-initializing');

  let introDismissed = false;
  function dismissQuizIntro() {
    if (introDismissed) return;
    introDismissed = true;
    quizGameIntroModal.classList.remove('show');
    quizGameIntroModal.setAttribute('aria-hidden', 'true');
    try {
      sessionStorage.setItem('gameIntroSeen', 'true');
    } catch (e) {}
    const level = quizLevels[0];
    renderOptionsMedia(level, 0, false);
    playQuizVideo();
  }

  quizConfirmPlayBtn?.addEventListener('click', dismissQuizIntro, { once: true });

  quizGameIntroModal.addEventListener('click', (e) => {
    if (!e.target.closest('.modal-content-box')) {
      dismissQuizIntro();
    }
  });
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startQuizPage, { once: true });
} else {
  startQuizPage();
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
    const level = getLocalizedLevel(quizLevels[currentLevelIndex]);
    showModal('success', translate('quiz.feedback.correctTitle', 'Absolutely Right!'), level.successText);
  });
}

if (btnNo) {
  btnNo.addEventListener('click', () => {
    if (isAnswered) return;
    if (quizLevels[currentLevelIndex].type === 'emergency') return;
    isAnswered = true;
    stopOptionsVideoPlayback(false);

    const level = getLocalizedLevel(quizLevels[currentLevelIndex]);
    quizVideo.pause();
    quizVideo.removeAttribute('loop');
    // No -> Incorrect choice (stroke symptoms must not be ignored)
    showModal('error', translate('quiz.feedback.incorrectTitle', 'Incorrect Choice!'), level.incorrectText);
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
  preloadNextLevelAssets(currentLevelIndex + 1);
  updateVideoSubtitles();
  if (feedbackModal) feedbackModal.classList.add('show');
}

nextLevelBtn.addEventListener('click', () => {
  feedbackModal.classList.remove('show');

  const nextIndex = currentLevelIndex + 1;
  if (nextIndex < quizLevels.length) {
    setTimeout(() => {
      renderLevel(nextIndex);
    }, 100);
  }

  setTimeout(() => {
    feedbackModal.classList.remove('modal-success', 'modal-error');

    if (nextIndex >= quizLevels.length) {
      window.location.href = 'thanks.html';
    }
  }, 300);
});
