const loremText = `nice to meet you, my name is what's your name? how do you like your coffee? one espresso and one kona drip, please. i don't want to talk about coffee anymore! can i walk you to the station? it's okay? what are you looking for? to spend time with someone i find attractive and enjoy being around. a reasonable man. my locking meetup. what a strange girl. we should take things slow. we can help each other! you only laugh at yourself. welcome! booba. we should cool down on how much time we spend together. booba? i wonder how we'll shape each other. booba i like how you worked before. booba i think that you're a reasonable chinese man. i miss you. sopa. booba i need alone time. i love you. trocadero. quad espresso over ice. do you care about my feelings? fuck you! i want you to be the very best that you can be. so delicious! thank you. i want to be a free bird. i still love and care about you very much. our vancouver home. i want to be selfish, sometimes. booba. never love a wild thing. the pain will come. the pain will come. so get it over with. neque odio, et finibus ante aliquet et. Ut in lectus justo. Integer mollis cursus sapien, non mollis elit convallis quis. Donec facilisis neque odio, ut tempor dui mollis sed. Mauris id molestie nibh. Proin imperdiet at ante non condimentum. Sed sit amet velit sed nulla posuere semper et eget eros. Morbi ultricies, risus eu commodo dapibus, mi sapien ullamcorper leo, ac ornare dui neque scelerisque mi. Proin eget tempor nibh. Ut porta lectus eu magna varius, at blandit ante gravida. Sed id eros mauris. Etiam porta purus quis ligula tempus, eget luctus nisi placerat. In congue posuere interdum. Pellentesque iaculis suscipit ipsum et condimentum. Quisque in odio pellentesque, scelerisque lorem in, euismod velit. Donec rhoncus erat sit amet enim laoreet porta. Integer interdum leo dolor, nec euismod justo tempus nec. Ut eu libero eu lacus elementum hendrerit ut ac eros. Maecenas rhoncus tempus eros sit amet lobortis. Nulla facilisi. Donec placerat, sem nec accumsan luctus, urna leo efficitur purus, ac egestas est sapien et tortor. Integer eu lacinia lorem, fermentum consectetur magna. Mauris sed purus lacinia, fringilla augue eu, dictum eros. Phasellus non fringilla metus. Etiam condimentum, ante vitae fermentum euismod, odio ante viverra risus, at porta libero nisi sed quam. Sed faucibus fermentum quam sit amet condimentum. Maecenas tincidunt interdum dui, efficitur eleifend justo porta sed. Suspendisse vestibulum ante vel est eleifend, nec convallis eros hendrerit. Donec in tellus in massa porta congue. Nullam tempor lobortis justo, eget feugiat purus accumsan in. Etiam feugiat nisl vitae odio porttitor auctor. Nunc sed erat luctus purus blandit tristique. Etiam vitae ligula eu est semper dictum. Duis nec enim sodales, mattis orci semper, sagittis arcu. Morbi accumsan vehicula sollicitudin. Ut pulvinar sagittis purus, quis vehicula libero imperdiet quis. Phasellus ut orci ut est pulvinar viverra non eget nisi. Suspendisse et sollicitudin lorem. Sed maximus elit at dolor commodo ultrices. Curabitur convallis nibh ut ipsum vulputate, vitae volutpat nisl cursus. Morbi imperdiet varius ligula vitae lobortis. Sed ut rutrum purus, eget accumsan mauris. Morbi nisl diam, semper et nunc nec, porttitor bibendum urna. Duis nec est libero. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum mattis congue elit, elementum sagittis arcu fringilla nec. Vivamus pulvinar arcu neque, nec venenatis dolor rhoncus sed. Pellentesque eget magna leo. Donec vitae cursus ex. Fusce vitae mollis eros. In lacus risus, ultricies id ipsum nec, accumsan venenatis magna. Sed sed ipsum vitae felis tincidunt lobortis. Nullam id neque nec odio lacinia cursus quis ut dolor. Maecenas sit amet porta mi. Vivamus rutrum feugiat placerat. Vestibulum blandit suscipit est, sed eleifend turpis fermentum non. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In molestie aliquet mauris sit amet semper. `.repeat(30);

const bgAudio = document.getElementById('bg-audio');
let interacted = false;
const startAudio = () => bgAudio.play().catch(() => {});
document.addEventListener('click', startAudio, { once: true });
document.addEventListener('keydown', startAudio, { once: true });
document.addEventListener('pointerdown', startAudio, { once: true });

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const blurOverlay = document.getElementById('blur-overlay');
const notepad = document.getElementById('notepad');
const notepadTitlebar = document.getElementById('notepad-titlebar');
const notepadTextarea = notepad.querySelector('textarea');

// --- Notepad drag ---
let npDragging = false, npOX = 0, npOY = 0;
notepadTitlebar.addEventListener('mousedown', (e) => {
  npDragging = true;
  const r = notepad.getBoundingClientRect();
  npOX = e.clientX - r.left;
  npOY = e.clientY - r.top;
  e.preventDefault();
});
document.addEventListener('mousemove', (e) => {
  if (!npDragging) return;
  notepad.style.left = (e.clientX - npOX) + 'px';
  notepad.style.top = (e.clientY - npOY) + 'px';
  notepad.style.transform = 'none';
});
document.addEventListener('mouseup', () => { npDragging = false; });

// Update notepad line/col on textarea input
notepadTextarea.addEventListener('input', () => {
  const lines = notepadTextarea.value.substr(0, notepadTextarea.selectionStart).split('\n');
  document.getElementById('notepad-statusbar').textContent =
    `Ln ${lines.length}, Col ${lines[lines.length - 1].length + 1}`;
});
const reveal = document.getElementById('reveal');
const revealSpan = document.getElementById('reveal-text').querySelector('span');
const cursor = document.getElementById('cursor');
const scrollbar = document.getElementById('scrollbar');
const thumb = document.getElementById('thumb');
const devCounter = document.getElementById('dev-counter');
const skipBtn = document.getElementById('skip-btn');
const skipMessages = [
  "please don't leave",
  "don't go",
  "don't leave me here",
  "i'll wait",
  "won't you please stay?",
  "stay.",
  "...",
  "please",
  "...",
  "i'm tired.",
  "",
];
let skipMsgIndex = 0;
skipBtn.addEventListener('click', () => {
  skipBtn.classList.remove('pressed');
  void skipBtn.offsetWidth; // force reflow to restart animation
  skipBtn.classList.add('pressed');
  if (!interacted) {
    interacted = true;
    if (radius <= minRadius) { draw(); return; } // circle not started yet — show prompt
  }
  if (radius <= minRadius) return;
  notepadTextarea.value = skipMessages[skipMsgIndex % skipMessages.length];
  notepadTextarea.style.paddingTop = '81px'; // vertically centers one line in 180px textarea
  skipMsgIndex++;
  notepad.style.display = 'flex';
});

// =========================================
// CONFIG — all tuneable values in one place
// =========================================
const CIRCLE_SPEED    = 1;    // px of radius per scroll/key tick
const TYPING_SPEED        = 0.5;  // chars per scroll/key tick (non-kawara pages)
const TYPING_SPEED_KAWARA = 0.1;  // chars per scroll/key tick (kawara/timeStr page)
const HOLD_TICKS      = 15;   // scroll ticks to pause before advancing to next sentence
const FONT_SIZE       = 7;    // canvas text size in px
const CONDENSE_START  = 0.6;  // 0–1: fraction of max radius where condensing begins
const MIN_LINE_HEIGHT = 0.3;  // minimum line height when fully condensed (px)
const MAX_CHAR_SQUEEZE = 6;   // max px removed from char spacing when condensed
const MAX_BLUR        = 2;    // max backdrop blur in px (reached at full circle)
const BLUR_EASE       = 0.3;  // blur ramp exponent — lower = slower start
const GRAIN_FADE_T    = 0.875; // t value (~70% scrollbar) where grain starts fading in
const SCROLLBAR_DRAG  = false; // enable scrollbar thumb dragging (dev tool)
const SHOW_LOVE          = false; // toggle "love" word on/off
const SHOW_GRADIENT      = false;  // toggle radial gradient on/off
const GIF_SCALE          = 4 / 3; // size multiplier relative to text circle diameter
const GIF_OFFSET_X       = 15;   // px: shift GIF horizontally (+ = right)
const GIF_OFFSET_Y       = 65;   // px: shift GIF vertically   (+ = down)
const GIF_REVOLUTIONS    = 2;    // full cycles before advancing
const BIRDS_START_PCT    = 73;    // scrollbar % where birds appear
const BIRDS_AMPLITUDE    = 70;    // vertical sine amplitude in px
const BIRDS_FREQ         = 0.018; // sine frequency — lower = wider waves
const BIRDS_FRAME_TICKS  = 4;    // scroll ticks per GIF frame advance
const BIRDS_SCALE        = 0.5;  // size multiplier for birds GIF
const GIF_FRAME_SKIP     = 3;    // scroll ticks per globe frame (higher = slower)
const RETURN_SPEED_MULT  = 30;   // speed multiplier when scrolling back after reaching 100%
// =========================================

// Grain effect — separate overlay canvas so it fades in over the circle
const grainCanvas = document.getElementById('grain-canvas');
const grainCanvasCtx = grainCanvas.getContext('2d');
const grainOffscreen = document.createElement('canvas');
grainOffscreen.width = 320;
grainOffscreen.height = 200;
const grainCtx = grainOffscreen.getContext('2d');
let grainAnimId = null;

function drawGrainFrame() {
  const w = grainOffscreen.width;
  const h = grainOffscreen.height;
  const imageData = grainCtx.createImageData(w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 20;
    data[i] = v; data[i+1] = v; data[i+2] = v; data[i+3] = 255;
  }
  grainCtx.putImageData(imageData, 0, 0);
  grainCanvasCtx.drawImage(grainOffscreen, 0, 0, grainCanvas.width, grainCanvas.height);
  grainAnimId = requestAnimationFrame(drawGrainFrame);
}

function startGrain() {
  if (grainAnimId) return;
  drawGrainFrame();
}

function stopGrain() {
  if (!grainAnimId) return;
  cancelAnimationFrame(grainAnimId);
  grainAnimId = null;
  grainCanvas.style.opacity = '0';
}

const LOVE_LOCATIONS = [{ pct: 15, nx: -0.04, ny: 0 }];

const loveCanvas = document.getElementById('love-canvas');
const loveCtx = loveCanvas.getContext('2d');

// Globe GIF scroll control
const GIF_TRIGGER_T = 32 / 80;
let gifFrames = null;
let gifPhase = 'pre'; // 'pre' | 'playing' | 'done'
let gifFrameIndex = 0;
let gifFrameSkipCount = 0;
let gifRevolutionCount = 0;
let gifFrozenRadius = 0;
let gifNaturalW = 1, gifNaturalH = 1;
const gifTempCanvas = document.createElement('canvas');
const gifTempCtx = gifTempCanvas.getContext('2d');
const globeCanvas = document.getElementById('globe-canvas');
const globeCtx = globeCanvas.getContext('2d');

Promise.all([
  import('https://esm.sh/gifuct-js'),
  fetch('globe gif.gif').then(r => r.arrayBuffer())
]).then(([{ parseGIF, decompressFrames }, buffer]) => {
  const gif = parseGIF(buffer);
  gifNaturalW = gif.lsd.width;
  gifNaturalH = gif.lsd.height;
  gifTempCanvas.width = gifNaturalW;
  gifTempCanvas.height = gifNaturalH;
  const rawFrames = decompressFrames(gif, true);
  // Pre-render all frames to ImageData for seekable playback
  gifFrames = rawFrames.map((frame, i) => {
    if (i === 0 || frame.disposalType === 2) {
      gifTempCtx.clearRect(0, 0, gifNaturalW, gifNaturalH);
    }
    gifTempCtx.putImageData(
      new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height),
      frame.dims.left, frame.dims.top
    );
    return gifTempCtx.getImageData(0, 0, gifNaturalW, gifNaturalH);
  });
});

// --- Birds GIF ---
const birdsCanvas = document.getElementById('birds-canvas');
const birdsCtx = birdsCanvas.getContext('2d');
const birdsTempCanvas = document.createElement('canvas');
const birdsTempCtx = birdsTempCanvas.getContext('2d');
let birdsFrames = null;
let birdsNaturalW = 1, birdsNaturalH = 1;

Promise.all([
  import('https://esm.sh/gifuct-js'),
  fetch('ascii-birds.gif').then(r => r.arrayBuffer())
]).then(([{ parseGIF, decompressFrames }, buffer]) => {
  const gif = parseGIF(buffer);
  birdsNaturalW = gif.lsd.width;
  birdsNaturalH = gif.lsd.height;
  birdsTempCanvas.width = birdsNaturalW;
  birdsTempCanvas.height = birdsNaturalH;
  const rawFrames = decompressFrames(gif, true);
  birdsFrames = rawFrames.map((frame, i) => {
    if (i === 0 || frame.disposalType === 2) {
      birdsTempCtx.clearRect(0, 0, birdsNaturalW, birdsNaturalH);
    }
    birdsTempCtx.putImageData(
      new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height),
      frame.dims.left, frame.dims.top
    );
    // Black background → transparent; non-black (birds) → solid white
    const imgData = birdsTempCtx.getImageData(0, 0, birdsNaturalW, birdsNaturalH);
    const px = imgData.data;
    for (let j = 0; j < px.length; j += 4) {
      if (px[j] < 40 && px[j + 1] < 40 && px[j + 2] < 40) {
        px[j + 3] = 0;
      } else {
        px[j] = 255; px[j + 1] = 255; px[j + 2] = 255; px[j + 3] = 255;
      }
    }
    birdsTempCtx.putImageData(imgData, 0, 0);
    return birdsTempCtx.getImageData(0, 0, birdsNaturalW, birdsNaturalH);
  });
});

function drawBirds() {
  const t = (radius - minRadius) / (maxRadius() - minRadius);
  const scrollPct = t * 80;
  if (!birdsFrames || scrollPct < BIRDS_START_PCT || radius >= maxRadius()) {
    birdsCanvas.style.display = 'none';
    return;
  }
  birdsCanvas.style.display = 'block';
  birdsCtx.clearRect(0, 0, birdsCanvas.width, birdsCanvas.height);

  const birdsStartRadius = (BIRDS_START_PCT / 80) * (maxRadius() - minRadius) + minRadius;
  const totalTicks = (maxRadius() - birdsStartRadius) / CIRCLE_SPEED;
  const offset = Math.max(0, (radius - birdsStartRadius) / CIRCLE_SPEED);
  const cy = birdsCanvas.height / 2;
  const scaledW = birdsNaturalW * BIRDS_SCALE;
  const scaledH = birdsNaturalH * BIRDS_SCALE;
  // Auto-speed: birds enter right edge at 73% and are fully off left edge at 80%
  const birdsSpeed = (birdsCanvas.width + scaledW) / totalTicks;

  const frameIndex = Math.floor(offset / BIRDS_FRAME_TICKS) % birdsFrames.length;
  birdsTempCtx.putImageData(birdsFrames[frameIndex], 0, 0);

  const x = birdsCanvas.width - offset * birdsSpeed;
  const y = cy - scaledH / 2 + Math.sin(offset * BIRDS_FREQ) * BIRDS_AMPLITUDE;
  birdsCtx.drawImage(birdsTempCanvas, x, y, scaledW, scaledH);
}

function renderGifFrame(index) {
  if (!gifFrames || !gifFrames[index]) return;
  gifTempCtx.putImageData(gifFrames[index], 0, 0);
  // Black full-screen background, then GIF scaled and centered to match circle
  globeCtx.fillStyle = '#000';
  globeCtx.fillRect(0, 0, globeCanvas.width, globeCanvas.height);
  const d = gifFrozenRadius * 2 * GIF_SCALE;
  const cx = globeCanvas.width / 2 + GIF_OFFSET_X;
  const cy = globeCanvas.height / 2 + GIF_OFFSET_Y;
  globeCtx.drawImage(gifTempCanvas, cx - d / 2, cy - d / 2, d, d);
}

function enterGifPhase() {
  if (!gifFrames) return; // not loaded yet, skip
  gifPhase = 'playing';
  gifFrameIndex = 0;
  gifRevolutionCount = 0;
  gifFrozenRadius = radius;
  // Full-screen canvas so black bg covers everything
  globeCanvas.width = window.innerWidth;
  globeCanvas.height = window.innerHeight;
  globeCanvas.style.width = '100%';
  globeCanvas.style.height = '100%';
  globeCanvas.style.left = '0';
  globeCanvas.style.top = '0';
  globeCanvas.style.display = 'block';
  canvas.style.display = 'none';
  blurOverlay.style.display = 'none';
  renderGifFrame(0);
}

function advanceGifFrame(dir) {
  gifFrameIndex += dir;
  if (gifFrameIndex >= gifFrames.length) {
    gifRevolutionCount++;
    gifFrameIndex = 0;
    if (gifRevolutionCount >= GIF_REVOLUTIONS) {
      gifPhase = 'done';
      globeCanvas.style.display = 'none';
      canvas.style.display = 'block';
      blurOverlay.style.display = 'block';
      draw();
      updateThumb();
      return;
    }
  }
  if (gifFrameIndex < 0) {
    gifFrameIndex = 0;
    gifPhase = 'pre';
    globeCanvas.style.display = 'none';
    canvas.style.display = 'block';
    blurOverlay.style.display = 'block';
    radius = Math.max(minRadius, gifFrozenRadius - CIRCLE_SPEED);
    draw();
    updateThumb();
    return;
  }
  renderGifFrame(gifFrameIndex);
}

function drawLoveWords() {
  loveCtx.clearRect(0, 0, loveCanvas.width, loveCanvas.height);
  if (!SHOW_LOVE) return;

  const scrollPct = ((radius - minRadius) / (maxRadius() - minRadius)) * 80;
  if (radius <= minRadius || radius >= maxRadius()) {
    loveCanvas.style.filter = '';
    return;
  }

  const cx = loveCanvas.width / 2;
  const cy = loveCanvas.height / 2;

  // Mirror the exact same layout params as draw()
  const t = Math.max(0, (radius - minRadius) / (maxRadius() - minRadius));

  // Match the backdrop-filter blur starting at 35%
  if (scrollPct >= 35) {
    loveCanvas.style.filter = `blur(${(Math.pow(t, BLUR_EASE) * MAX_BLUR).toFixed(2)}px)`;
  } else {
    loveCanvas.style.filter = '';
  }
  const condenseT = Math.min(0.95, Math.max(0, (t - CONDENSE_START) / (1 - CONDENSE_START)));
  const currentLineHeight = lineHeight - condenseT * (lineHeight - MIN_LINE_HEIGHT);
  const squeeze = condenseT * MAX_CHAR_SQUEEZE;

  loveCtx.font = `${scrollPct <= 49 ? 'bold ' : ''}${fontSize}px monospace`;
  loveCtx.fillStyle = '#000';
  const charWidth = loveCtx.measureText('m').width;
  const cw = Math.max(0.5, charWidth - squeeze);

  LOVE_LOCATIONS.forEach(({ pct, nx, ny }) => {
    if (scrollPct < pct) return;

    // Normalized position scaled to current circle radius
    const tx = cx + nx * radius;
    const ty = cy + ny * radius;

    // Snap to the nearest text row
    const rowIndex = Math.round((ty - (cy - radius)) / currentLineHeight);
    const snappedY = cy - radius + rowIndex * currentLineHeight;

    // Verify row is inside circle
    const dy = (snappedY + currentLineHeight / 2) - cy;
    if (Math.abs(dy) > radius) return;

    const halfWidth = Math.sqrt(radius * radius - dy * dy);
    const xStart = cx - halfWidth;
    const xEnd = cx + halfWidth;

    // Snap to nearest character column
    const snappedX = xStart + Math.round((tx - xStart) / cw) * cw;

    // Ensure "love" fits within the row
    if (snappedX < xStart || snappedX + cw * 4 > xEnd) return;

    loveCtx.fillText('love', snappedX, snappedY + fontSize, cw * 4);
  });
}

function renderRevealText(text, isKawara) {
  if (!isKawara) return text;
  return text.replace(/\d/g, '<span class="digit">$&</span>');
}

const startTime = Date.now();

function buildPages() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0
    ? `${mins} minute${mins !== 1 ? 's' : ''}, ${secs} second${secs !== 1 ? 's' : ''}`
    : `${secs} second${secs !== 1 ? 's' : ''}`;
  return [
    `${timeStr}.`,
    "this time together has meant the world to me.",
    "but,",
    "i know you don't want to be here anymore.",
    "i won't hold you here any longer.",
    "i'll let you be free now.",
    "goodbye."
  ];
}

let pages = buildPages();
let pageIndex = 0;
let charCount = 0;
let holdTicks = 0;
let hasFinished = false;
let hasReached100 = false;
let eggActive = false;
let eggPageIndex = 0;
let eggCharCount = 0;
let eggHoldTicks = 0;

const easterEggPages = [
  `"Blessed are the forgetful: for they get the better even of their blunders."`,
  `"You know what's wrong with you, Miss Whoever-you-are? You're chicken, you've got no guts. You're afraid to stick out your chin and say, "Okay, life's a fact, people do fall in love, people do belong to each other, because that's the only chance anybody's got for real happiness." You call yourself a free spirit, a "wild thing," and you're terrified somebody's gonna stick you in a cage. Well baby, you're already in that cage. You built it yourself. And it's not bounded in the west by Tulip, Texas, or in the east by Somali-land. It's wherever you go. Because no matter where you run, you just end up running into yourself."`,
  `"I wish you'd stayed."`,
  `"I wish I'd stayed, too."`
];

const fontSize = FONT_SIZE;
const lineHeight = fontSize * 1.4;
const minRadius = 18;
let radius = minRadius;

function maxRadius() {
  return Math.sqrt((window.innerWidth / 2) ** 2 + (window.innerHeight / 2) ** 2);
}

function updateThumb() {
  const trackH = scrollbar.clientHeight - thumb.offsetHeight;
  let t;
  if (radius >= maxRadius()) {
    const pageT = (pageIndex + Math.min(charCount / Math.max(1, pages[pageIndex].length), 1)) / pages.length;
    t = 0.8 + pageT * 0.2;
  } else {
    // circle phase occupies 0–80% so the final scene doesn't cause a jump
    t = ((radius - minRadius) / (maxRadius() - minRadius)) * 0.8;
  }
  thumb.style.top = (Math.min(1, t) * trackH) + 'px';
  devCounter.textContent = Math.round(Math.min(1, t) * 100) + '%';
}

function setRadius(r) {
  if (gifPhase === 'playing') return;
  radius = Math.max(minRadius, Math.min(maxRadius(), r));
  const tCheck = (radius - minRadius) / (maxRadius() - minRadius);
  if (tCheck >= GIF_TRIGGER_T && gifPhase === 'pre' && gifFrames) {
    enterGifPhase();
    return;
  }
  // Reset so globe plays again on every pass-through
  if (tCheck < GIF_TRIGGER_T && gifPhase === 'done') gifPhase = 'pre';
  draw();
  updateThumb();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  grainCanvas.width = window.innerWidth;
  grainCanvas.height = window.innerHeight;
  loveCanvas.width = window.innerWidth;
  loveCanvas.height = window.innerHeight;
  birdsCanvas.width = window.innerWidth;
  birdsCanvas.height = window.innerHeight;
  drawLoveWords();
  draw();
  updateThumb();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // compute condensing factor (0 = normal, 1 = fully condensed)
  const t = Math.max(0, (radius - minRadius) / (maxRadius() - minRadius));
  const condenseT = Math.min(0.95, Math.max(0, (t - CONDENSE_START) / (1 - CONDENSE_START)));
  const currentLineHeight = lineHeight - condenseT * (lineHeight - MIN_LINE_HEIGHT);
  const squeeze = condenseT * MAX_CHAR_SQUEEZE;

  ctx.font = `${fontSize}px monospace`;
  const charWidth = ctx.measureText('m').width; // monospace: measure once
  const cw = Math.max(0.5, charWidth - squeeze);

  if (radius <= minRadius) {
    if (interacted) {
      const promptSize = fontSize + 1;
      ctx.font = `${promptSize}px monospace`;
      const word = 'scroll or press arrow keys to begin';
      const w = ctx.measureText(word).width;
      ctx.fillText(word, cx - w / 2, cy + promptSize / 2);
      ctx.font = `${fontSize}px monospace`;
    }
    // else: blank before first interaction
  } else {
    let ti = 0;
    for (let y = cy - radius; y <= cy + radius; y += currentLineHeight) {
      const dy = (y + currentLineHeight / 2) - cy;
      if (Math.abs(dy) > radius) continue;
      const halfWidth = Math.sqrt(radius * radius - dy * dy);
      const xStart = cx - halfWidth;
      const xEnd = cx + halfWidth;
      const rowWidth = xEnd - xStart;
      const charsInRow = Math.floor(rowWidth / cw);
      if (charsInRow <= 0) continue;
      let rowStr = '';
      for (let i = 0; i < charsInRow; i++) {
        rowStr += loremText[(ti + i) % loremText.length];
      }
      ti += charsInRow;
      ctx.fillText(rowStr, xStart, y + fontSize, rowWidth);
    }

    // Radial gradient mask: bell curve from 75%→80%, peaks at midpoint
    const scrollPctLocal = t * 80;
    const gradNorm = Math.max(0, Math.min(1, (scrollPctLocal - 79) / (80 - 79)));
    const gradientT = Math.sin(gradNorm * Math.PI);
    if (SHOW_GRADIENT && gradientT > 0) {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,    `rgba(0,0,0,0)`);
      grad.addColorStop(0.35, `rgba(0,0,0,${(gradientT * 0.4).toFixed(3)})`);
      grad.addColorStop(1,    'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // Grain fade-in: starts at GRAIN_FADE_T, fully opaque at maxRadius
  if (t >= GRAIN_FADE_T) {
    startGrain();
    grainCanvas.style.opacity = ((t - GRAIN_FADE_T) / (1 - GRAIN_FADE_T)).toFixed(3);
  } else {
    stopGrain();
  }

  drawLoveWords();
  drawBirds();
  checkFill();
}


function exitFinalScene() {
  charCount = 0; pageIndex = 0;
  revealSpan.innerHTML = '';
  revealSpan.classList.remove('kawara');
  cursor.classList.remove('kawara');
  cursor.style.display = 'none';
  reveal.style.opacity = '0';
  reveal.classList.remove('active');
  canvas.style.display = 'block';
  blurOverlay.style.display = 'block';
  document.body.style.background = '#fff';
  scrollbar.style.background = '#e0e0e0';
  thumb.style.background = '#000';
  skipBtn.style.display = 'block';
  radius = maxRadius() - CIRCLE_SPEED;
  draw();
  updateThumb();
}

function showEggScene() {
  eggActive = true; eggPageIndex = 0; eggCharCount = 0;
  revealSpan.classList.remove('kawara');
  cursor.classList.remove('kawara');
  revealSpan.innerHTML = '';
  cursor.style.display = 'inline-block';
  reveal.style.opacity = '1';
  reveal.classList.add('active');
  canvas.style.display = 'none';
  blurOverlay.style.display = 'none';
  document.body.style.background = '#000';
  scrollbar.style.background = '#333';
  thumb.style.background = '#fff';
  skipBtn.style.display = 'none';
}

function checkFill() {
  if (radius >= maxRadius()) {
    reveal.style.opacity = '1';
    reveal.classList.add('active');
    canvas.style.display = 'none';
    blurOverlay.style.display = 'none';
    notepad.style.display = 'none';
    document.body.style.background = '#000';
    scrollbar.style.background = '#333';
    thumb.style.background = '#fff';
    if (!revealSpan.textContent) { pages = buildPages(); revealSpan.textContent = ''; }
    skipBtn.style.display = 'none';
  } else if (radius <= minRadius) {
    if (eggActive) {
      // Easter egg scene is active — keep black screen, don't reset state
      reveal.style.opacity = '1';
      reveal.classList.add('active');
      canvas.style.display = 'none';
      blurOverlay.style.display = 'none';
      document.body.style.background = '#000';
      scrollbar.style.background = '#333';
      thumb.style.background = '#fff';
      skipBtn.style.display = 'none';
      return;
    }
    if (hasFinished) { showEggScene(); return; }
    blurOverlay.style.backdropFilter = `blur(0px)`;
    blurOverlay.style.webkitBackdropFilter = `blur(0px)`;
    blurOverlay.style.background = 'transparent';
    blurOverlay.style.display = 'block';
    stopGrain();
    notepad.style.display = 'none';
    reveal.style.opacity = '0';
    reveal.classList.remove('active');
    canvas.style.display = 'block';
    charCount = 0;
    pageIndex = 0;
    revealSpan.textContent = '';
    cursor.style.display = 'none';
    document.body.style.background = '#fff';
    scrollbar.style.background = '#e0e0e0';
    thumb.style.background = '#000';
  } else {
    const blurT = (radius - minRadius) / (maxRadius() - minRadius);
    const blurPx = (Math.pow(blurT, BLUR_EASE) * MAX_BLUR).toFixed(2);
    blurOverlay.style.backdropFilter = `blur(${blurPx}px)`;
    blurOverlay.style.webkitBackdropFilter = `blur(${blurPx}px)`;
    blurOverlay.style.background = 'transparent';
    blurOverlay.style.display = 'block';
    stopGrain();
    // notepad visibility is controlled by skip button clicks
    reveal.style.opacity = '0';
    reveal.classList.remove('active');
    canvas.style.display = 'block';
    document.body.style.background = '#fff';
    scrollbar.style.background = '#e0e0e0';
    thumb.style.background = '#000';
  }
}

window.addEventListener('wheel', (e) => {
  e.preventDefault();
  notepad.style.display = 'none';
  if (gifPhase === 'playing') {
    const gDir = e.deltaY > 0 ? 1 : -1;
    gifFrameSkipCount += gDir;
    if (Math.abs(gifFrameSkipCount) >= GIF_FRAME_SKIP) {
      gifFrameSkipCount = 0;
      advanceGifFrame(gDir);
    }
    return;
  }
  if (eggActive) {
    // Invert: scrolling backward (up) types forward, scrolling forward (down) exits
    const rawDir = e.deltaY > 0 ? 1 : -1;
    const eggDir = -rawDir;
    const currentPage = easterEggPages[eggPageIndex];
    const fullyTyped = Math.floor(eggCharCount) >= currentPage.length;
    if (fullyTyped && eggDir > 0) {
      eggHoldTicks++;
      if (eggHoldTicks >= HOLD_TICKS) {
        eggHoldTicks = 0;
        if (eggPageIndex < easterEggPages.length - 1) { eggPageIndex++; eggCharCount = 0; }
      }
    } else {
      eggHoldTicks = 0;
      eggCharCount = Math.max(0, eggCharCount + eggDir * TYPING_SPEED);
      if (eggCharCount <= 0 && eggDir < 0) {
        if (eggPageIndex > 0) { eggPageIndex--; eggCharCount = easterEggPages[eggPageIndex].length; }
        else { eggActive = false; hasFinished = false; radius = minRadius + CIRCLE_SPEED; draw(); updateThumb(); return; }
      }
      eggCharCount = Math.max(0, Math.min(easterEggPages[eggPageIndex].length, eggCharCount));
    }
    revealSpan.innerHTML = easterEggPages[eggPageIndex].slice(0, Math.floor(eggCharCount));
    cursor.style.display = Math.floor(eggCharCount) < easterEggPages[eggPageIndex].length ? 'inline-block' : 'none';
    updateThumb();
    return;
  }
  if (radius >= maxRadius()) {
    const dir = e.deltaY > 0 ? 1 : -1;
    const currentPage = pages[pageIndex];
    const fullyTyped = Math.floor(charCount) >= currentPage.length;
    if (pageIndex >= pages.length - 1 && fullyTyped) { hasFinished = true; hasReached100 = true; }
    if (fullyTyped && dir > 0) {
      holdTicks++;
      if (holdTicks >= HOLD_TICKS) {
        holdTicks = 0;
        if (pageIndex < pages.length - 1) { pageIndex++; charCount = 0; }
      }
    } else {
      holdTicks = 0;
      charCount = Math.max(0, charCount + dir * (pageIndex === 0 ? TYPING_SPEED_KAWARA : TYPING_SPEED));
      if (charCount <= 0 && dir < 0) {
        if (pageIndex > 0) { pageIndex--; charCount = pages[pageIndex].length; }
        else { exitFinalScene(); return; }
      }
      charCount = Math.max(0, Math.min(pages[pageIndex].length, charCount));
    }
    revealSpan.classList.toggle('kawara', pageIndex === 0);
    cursor.classList.toggle('kawara', pageIndex === 0);
    revealSpan.innerHTML = renderRevealText(pages[pageIndex].slice(0, Math.floor(charCount)), pageIndex === 0);
    cursor.style.display = Math.floor(charCount) < pages[pageIndex].length ? 'inline-block' : 'none';
    updateThumb();
    return;
  }
  const scrollDir = e.deltaY > 0 ? 1 : -1;
  const circleSpeed = (hasReached100 && scrollDir < 0) ? CIRCLE_SPEED * RETURN_SPEED_MULT : CIRCLE_SPEED;
  setRadius(radius + scrollDir * circleSpeed);
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  e.preventDefault();
  notepad.style.display = 'none';
  const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
  if (gifPhase === 'playing') {
    gifFrameSkipCount += dir;
    if (Math.abs(gifFrameSkipCount) >= GIF_FRAME_SKIP) {
      gifFrameSkipCount = 0;
      advanceGifFrame(dir);
    }
    return;
  }
  if (eggActive) {
    // Invert: arrow up types forward, arrow down exits
    const eggDir = -dir;
    const currentPage = easterEggPages[eggPageIndex];
    eggCharCount = Math.max(0, eggCharCount + eggDir * TYPING_SPEED);
    if (eggCharCount >= currentPage.length && eggDir > 0) {
      if (eggPageIndex < easterEggPages.length - 1) { eggPageIndex++; eggCharCount = 0; }
      else { eggCharCount = currentPage.length; }
    } else if (eggCharCount <= 0 && eggDir < 0) {
      if (eggPageIndex > 0) { eggPageIndex--; eggCharCount = easterEggPages[eggPageIndex].length; }
      else { eggActive = false; hasFinished = false; radius = minRadius + CIRCLE_SPEED; draw(); updateThumb(); return; }
    }
    eggCharCount = Math.max(0, Math.min(easterEggPages[eggPageIndex].length, eggCharCount));
    revealSpan.innerHTML = easterEggPages[eggPageIndex].slice(0, Math.floor(eggCharCount));
    cursor.style.display = Math.floor(eggCharCount) < easterEggPages[eggPageIndex].length ? 'inline-block' : 'none';
    return;
  }
  if (radius >= maxRadius()) {
    const currentPage = pages[pageIndex];
    if (pageIndex >= pages.length - 1 && Math.floor(charCount) >= currentPage.length) { hasFinished = true; hasReached100 = true; }
    charCount = Math.max(0, charCount + dir * (pageIndex === 0 ? TYPING_SPEED_KAWARA : TYPING_SPEED));
    if (charCount >= currentPage.length && dir > 0) {
      if (pageIndex < pages.length - 1) { pageIndex++; charCount = 0; }
      else { charCount = currentPage.length; }
    } else if (charCount <= 0 && dir < 0) {
      if (pageIndex > 0) { pageIndex--; charCount = pages[pageIndex].length; }
      else { exitFinalScene(); return; }
    }
    charCount = Math.max(0, Math.min(pages[pageIndex].length, charCount));
    revealSpan.classList.toggle('kawara', pageIndex === 0);
    cursor.classList.toggle('kawara', pageIndex === 0);
    revealSpan.innerHTML = renderRevealText(pages[pageIndex].slice(0, Math.floor(charCount)), pageIndex === 0);
    cursor.style.display = Math.floor(charCount) < pages[pageIndex].length ? 'inline-block' : 'none';
  } else {
    const kSpeed = (hasReached100 && dir < 0) ? CIRCLE_SPEED * RETURN_SPEED_MULT : CIRCLE_SPEED;
    // Update state immediately but throttle rendering via rAF to avoid
    // locking up during birds GIF when arrow keys repeat rapidly
    radius = Math.max(minRadius, Math.min(maxRadius(), radius + dir * kSpeed));
    const tCheck = (radius - minRadius) / (maxRadius() - minRadius);
    if (tCheck >= GIF_TRIGGER_T && gifPhase === 'pre' && gifFrames) { enterGifPhase(); return; }
    if (tCheck < GIF_TRIGGER_T && gifPhase === 'done') gifPhase = 'pre';
    updateThumb();
    if (!_keyDrawPending) {
      _keyDrawPending = true;
      requestAnimationFrame(() => { _keyDrawPending = false; draw(); });
    }
  }
});

let _keyDrawPending = false;

// Scrollbar drag (toggle with SCROLLBAR_DRAG in config)
let sbDragging = false, sbStartY = 0, sbStartRadius = 0;
thumb.addEventListener('mousedown', (e) => {
  if (!SCROLLBAR_DRAG) return;
  sbDragging = true; sbStartY = e.clientY; sbStartRadius = radius; e.preventDefault();
});
document.addEventListener('mousemove', (e) => {
  if (!SCROLLBAR_DRAG || !sbDragging) return;
  const trackH = scrollbar.clientHeight - thumb.offsetHeight;
  setRadius(sbStartRadius + ((e.clientY - sbStartY) / trackH) * (maxRadius() - minRadius));
});
document.addEventListener('mouseup', () => { sbDragging = false; });


window.addEventListener('resize', resize);
resize();

// Debug jump buttons (uncomment + add HTML buttons to re-enable)
// document.getElementById('debug-5').addEventListener('click', () => {
//   if (gifPhase === 'playing') { gifPhase = 'pre'; globeCanvas.style.display = 'none'; canvas.style.display = 'block'; blurOverlay.style.display = 'block'; }
//   setRadius(minRadius + 0.05 * (maxRadius() - minRadius));
// });
// document.getElementById('debug-100').addEventListener('click', () => {
//   if (gifPhase === 'playing') { gifPhase = 'done'; globeCanvas.style.display = 'none'; canvas.style.display = 'block'; blurOverlay.style.display = 'block'; }
//   setRadius(maxRadius());
// });
