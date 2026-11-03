// ============================================
// OPERATION BHAI DOOJ - Vanilla JavaScript
// ============================================

const screens = [...document.querySelectorAll('.screen')];
const loadingScreen = document.getElementById('loadingScreen');
const progressBar = document.getElementById('progressBar');
const percentage = document.getElementById('percentage');
const loadingText = document.getElementById('loadingText');
const loadingJoke = document.getElementById('loadingJoke');
const startButton = document.getElementById('startButton');

const loadingLines = [
  'Loading bhai ka gift...',
  "Checking bhai's behaviour... 🤨",
  'Searching for his good qualities...',
  'Calculating gift eligibility...',
  'Almost there... please do not run away!'
];

let loadingProgress = 0;
let loadingTimer = null;

function startLoadingAnimation() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interval = reducedMotion ? 110 : 420;

  loadingTimer = window.setInterval(() => {
    if (loadingProgress >= 99) {
      window.clearInterval(loadingTimer);
      loadingText.textContent = '99%... STUCK! 😭';
      loadingJoke.textContent = 'Bhai ne last year gift nahi diya tha, isliye loading slow ho rahi hai 😤';
      startButton.classList.remove('is-hidden');
      return;
    }

    const increment = Math.floor(Math.random() * 10) + 5;
    loadingProgress = Math.min(99, loadingProgress + increment);
    progressBar.style.width = `${loadingProgress}%`;
    percentage.textContent = `${loadingProgress}%`;

    let lineIndex = 0;
    if (loadingProgress >= 75) lineIndex = 4;
    else if (loadingProgress >= 52) lineIndex = 3;
    else if (loadingProgress >= 30) lineIndex = 2;
    else if (loadingProgress >= 12) lineIndex = 1;

    if (loadingProgress < 99) {
      loadingText.textContent = loadingLines[lineIndex];
      loadingText.classList.remove('bump');
      // Restart the short text animation without relying on a library.
      void loadingText.offsetWidth;
      loadingText.classList.add('bump');
    }
  }, interval);
}

function showScreen(screenId) {
  const target = document.getElementById(screenId);
  if (!target) return;

  screens.forEach((screen) => {
    const isTarget = screen.id === screenId;
    screen.classList.toggle('is-hidden', !isTarget);
    screen.classList.toggle('is-active', isTarget);
    screen.setAttribute('aria-hidden', String(!isTarget));
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (screenId === 'scratchScreen') {
    // Wait for the screen to become visible before measuring canvas dimensions.
    window.requestAnimationFrame(() => window.requestAnimationFrame(setupScratchCards));
  }
}

// All page navigation buttons use data-go attributes.
document.querySelectorAll('[data-go]').forEach((button) => {
  button.addEventListener('click', () => showScreen(button.dataset.go));
});

startButton.addEventListener('click', () => showScreen('welcomeScreen'));
startLoadingAnimation();

// ============================================
// FOUR-CARD SCRATCH GAME
// Only the first card scratched can be claimed.
// The other three reveal automatically as NOT WON.
// ============================================

const scratchCards = [...document.querySelectorAll('.scratch-card')];
const scratchResult = document.getElementById('scratchResult');
const lazyRevealButton = document.getElementById('lazyRevealButton');
const finalButton = document.getElementById('finalButton');
const scratchInstruction = document.querySelector('.scratch-instruction');

let scratchInitialized = false;
let chosenCardIndex = null;
let scratchContexts = [];

const scratchCardCopy = [
  { number: 1, emoji: '🎁', title: 'CARD 1', hint: 'SCRATCH ME!' },
  { number: 2, emoji: '🎁', title: 'CARD 2', hint: 'SCRATCH ME!' },
  { number: 3, emoji: '🎁', title: 'CARD 3', hint: 'SCRATCH ME!' },
  { number: 4, emoji: '🎁', title: 'CARD 4', hint: 'SCRATCH ME!' }
];

function setupScratchCards() {
  if (scratchInitialized) return;
  scratchInitialized = true;

  scratchCards.forEach((card, index) => {
    const canvas = card.querySelector('canvas');
    const rect = card.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScratchCover(context, cssWidth, cssHeight, scratchCardCopy[index]);

    scratchContexts[index] = { canvas, context, cssWidth, cssHeight, dpr, isDown: false };

    canvas.addEventListener('pointerdown', (event) => beginScratch(event, index));
    canvas.addEventListener('pointermove', (event) => continueScratch(event, index));
    canvas.addEventListener('pointerup', () => endScratch(index));
    canvas.addEventListener('pointercancel', () => endScratch(index));
    canvas.addEventListener('lostpointercapture', () => endScratch(index));
  });
}

function drawScratchCover(context, width, height, cardCopy) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#d94491');
  gradient.addColorStop(0.54, '#a34ab0');
  gradient.addColorStop(1, '#ef9d45');

  context.clearRect(0, 0, width, height);
  context.fillStyle = gradient;
  roundedRect(context, 0, 0, width, height, 22);
  context.fill();

  // A subtle festive sparkle pattern on the scratch layer.
  context.save();
  context.globalAlpha = 0.16;
  context.fillStyle = '#fff5de';
  for (let x = 18; x < width; x += 38) {
    for (let y = 16; y < height; y += 34) {
      context.beginPath();
      context.arc(x, y, 1.6, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();

  context.save();
  context.strokeStyle = 'rgba(255,255,255,.88)';
  context.lineWidth = 2;
  context.setLineDash([7, 6]);
  roundedRect(context, 9, 9, width - 18, height - 18, 16);
  context.stroke();
  context.setLineDash([]);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = 'rgba(65,19,59,.25)';
  context.shadowBlur = 4;
  context.fillStyle = '#fffdf8';
  context.font = `700 ${Math.max(18, Math.min(29, width * 0.085))}px Fredoka, sans-serif`;
  context.fillText(cardCopy.emoji, width / 2, height * 0.34);
  context.font = `700 ${Math.max(15, Math.min(24, width * 0.065))}px Fredoka, sans-serif`;
  context.fillText(cardCopy.title, width / 2, height * 0.59);
  context.font = `600 ${Math.max(12, Math.min(17, width * 0.046))}px Baloo 2, sans-serif`;
  context.fillText(cardCopy.hint, width / 2, height * 0.77);
  context.restore();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function beginScratch(event, index) {
  if (chosenCardIndex !== null) return;
  const state = scratchContexts[index];
  if (!state) return;

  state.isDown = true;
  try { state.canvas.setPointerCapture(event.pointerId); } catch (_) { /* Pointer capture is optional. */ }
  eraseScratch(event, index);
}

function continueScratch(event, index) {
  if (chosenCardIndex !== null) return;
  const state = scratchContexts[index];
  if (!state || !state.isDown) return;
  eraseScratch(event, index);

  if (getScratchedRatio(state) >= 0.29) {
    chooseWinningCard(index);
  }
}

function endScratch(index) {
  const state = scratchContexts[index];
  if (state) state.isDown = false;
}

function eraseScratch(event, index) {
  const state = scratchContexts[index];
  if (!state) return;
  const { context, canvas } = state;
  const point = getCanvasPoint(event, canvas);
  const brush = Math.max(18, Math.min(28, state.cssWidth * 0.065));

  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.beginPath();
  context.arc(point.x, point.y, brush, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function getScratchedRatio(state) {
  const { context, canvas } = state;
  try {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    let samples = 0;
    // Sample a small portion of pixels for a fast estimate on mobile devices.
    for (let i = 3; i < pixels.length; i += 96) {
      samples++;
      if (pixels[i] < 90) transparent++;
    }
    return samples ? transparent / samples : 0;
  } catch (error) {
    console.warn('Could not inspect scratch canvas pixels:', error);
    return 0;
  }
}

function chooseWinningCard(index) {
  if (chosenCardIndex !== null) return;
  chosenCardIndex = index;

  scratchCards.forEach((card, cardIndex) => {
    const canvas = card.querySelector('canvas');
    const status = card.querySelector('.prize-status');
    const state = scratchContexts[cardIndex];
    if (state) {
      state.isDown = false;
      state.context.clearRect(0, 0, state.cssWidth, state.cssHeight);
    } else if (canvas) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (cardIndex === index) {
      card.classList.add('is-winner');
      card.classList.remove('is-not-won');
      status.textContent = '🏆 YOU WON!';
    } else {
      card.classList.add('is-not-won');
      status.textContent = 'NOT WON 😜';
    }
    canvas.style.pointerEvents = 'none';
  });

  const winnerText = scratchCards[index].querySelector('.prize-name').textContent;
  scratchResult.textContent = `LUCKY YOU! You won: ${winnerText}. Baaki gifts sirf dekhne ke liye hain 😂`;
  scratchInstruction.textContent = '🎉 One gift unlocked! The other three are revealed, but not won.';
  scratchInstruction.classList.add('is-hidden');
  lazyRevealButton.classList.add('is-hidden');
  finalButton.classList.remove('is-hidden');
}

lazyRevealButton.addEventListener('click', () => {
  if (chosenCardIndex !== null) return;
  const randomIndex = Math.floor(Math.random() * scratchCards.length);
  chooseWinningCard(randomIndex);
});

// Refit the scratch canvases if the device rotates before the game begins.
// Existing event listeners are retained, so resizing never duplicates handlers.
let resizeFrame = null;
window.addEventListener('resize', () => {
  if (!scratchInitialized || chosenCardIndex !== null || document.getElementById('scratchScreen').classList.contains('is-hidden')) return;
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    scratchCards.forEach((card, index) => {
      const canvas = card.querySelector('canvas');
      const rect = card.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScratchCover(context, cssWidth, cssHeight, scratchCardCopy[index]);
      scratchContexts[index] = { canvas, context, cssWidth, cssHeight, dpr, isDown: false };
    });
  });
});

// ============================================
// FINAL PAGE: HEART & CONFETTI CELEBRATION
// ============================================

const loveButton = document.getElementById('loveButton');
const celebrationMessage = document.getElementById('celebrationMessage');
const celebrationEmojis = ['💗', '💛', '✨', '❤️', '🥳', '🎀', '🪔'];

loveButton.addEventListener('click', () => {
  celebrationMessage.textContent = 'LOVE YOU BHAI! HAPPY BHAI DOOJ! 🎉❤️';
  launchHearts(32);
  loveButton.textContent = 'LOVE SENT! 💌';
});

function launchHearts(count) {
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart-fall';
    heart.textContent = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.fontSize = `${18 + Math.random() * 18}px`;
    heart.style.setProperty('--fall-time', `${2.2 + Math.random() * 2.4}s`);
    heart.style.animationDelay = `${Math.random() * 0.75}s`;
    document.body.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
  }
}
