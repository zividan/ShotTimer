/* ============ STATE ============ */
let elapsedTime = 0;
let isRunning = false;
let startTime = null;
let timerInterval = null;

// Each shot: { text: string, start: number|undefined, end: number|undefined }
const shots = [];
let currentShotIndex = -1; // which shot is highlighted

// DOM references
const timerEl         = document.getElementById('timer');
const startPauseBtn   = document.getElementById('startPauseBtn');
const nextShotBtn     = document.getElementById('nextShotBtn');
const resetTimesBtn   = document.getElementById('resetTimesBtn');
const resetAllBtn     = document.getElementById('resetAllBtn');

const shotsList       = document.getElementById('shotsList');
const shotsScroll     = document.getElementById('shotsScroll');
const noShotsMsg      = document.getElementById('noShotsMsg');

const pasteTextsBtn   = document.getElementById('pasteTextsBtn');
const copyColumnBtn   = document.getElementById('copyColumnBtn');
const copyRowBtn      = document.getElementById('copyRowBtn');
const copyListBtn     = document.getElementById('copyListBtn');
const hiddenCopyArea  = document.getElementById('hiddenCopyArea');

// Current/Next text lines
const currentTextInner = document.getElementById('currentTextInner');
const shotLineCurrent  = document.getElementById('shotLineCurrent');
const shotLineNext     = document.getElementById('shotLineNext');

/* ====== HELPER: format mm:ss ====== */
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function updateTimerDisplay() {
  timerEl.textContent = formatTime(elapsedTime);
  timerEl.className = 'timer ' + (isRunning ? 'running' : 'paused');
}

function tick() {
  if (startTime !== null) {
    elapsedTime = Date.now() - startTime;
    updateTimerDisplay();
  }
}

/* ===== START/PAUSE ===== */
function startTimer() {
  if (!isRunning) {
    // Start or resume
    startTime = Date.now() - elapsedTime;
    isRunning = true;
    startPauseBtn.textContent = 'Pause';
    startPauseBtn.className = 'pause';
    nextShotBtn.disabled = false;

    // If we have shots but no highlight yet, highlight first shot
    if (shots.length > 0 && currentShotIndex < 0) {
      currentShotIndex = 0;
      if (shots[0].start === undefined) {
        shots[0].start = elapsedTime;
      }
    }
    timerInterval = setInterval(tick, 100);
  } else {
    // Pause
    isRunning = false;
    startPauseBtn.textContent = 'Start';
    startPauseBtn.className = 'start';
    nextShotBtn.disabled = true;
    clearInterval(timerInterval);
    timerInterval = null;
  }
  updateTimerDisplay();
  renderShots();
  updateShotTextLines(false);
}

/* ===== NEXT SHOT ===== */
function nextShot() {
  if (currentShotIndex < 0 || currentShotIndex >= shots.length) {
    alert('No available shot to set. Please paste texts or add shots first.');
    return;
  }
  // Ensure current shot has a start
  if (shots[currentShotIndex].start === undefined) {
    shots[currentShotIndex].start = elapsedTime;
  }
  // Set its end
  shots[currentShotIndex].end = elapsedTime;

  // Move to next shot
  const nextIndex = currentShotIndex + 1;
  if (nextIndex >= shots.length) {
    alert('No more shots to highlight – you’ve recorded them all!');
  } else {
    currentShotIndex = nextIndex;
    if (shots[currentShotIndex].start === undefined) {
      shots[currentShotIndex].start = elapsedTime;
    }
  }
  renderShots();
  // Animate the text lines
  rollShotText();
}

/* ===== RESET TIMES ===== */
function resetTimes() {
  if (timerInterval) clearInterval(timerInterval);
  elapsedTime = 0;
  isRunning = false;
  startTime = null;
  timerInterval = null;
  shots.forEach(s => {
    s.start = undefined;
    s.end   = undefined;
  });
  currentShotIndex = -1;

  startPauseBtn.textContent = 'Start';
  startPauseBtn.className = 'start';
  nextShotBtn.disabled = true;
  updateTimerDisplay();
  renderShots();
  updateShotTextLines(false);
}

/* ===== RESET ALL ===== */
function resetAll() {
  if (timerInterval) clearInterval(timerInterval);
  elapsedTime = 0;
  isRunning = false;
  startTime = null;
  timerInterval = null;
  shots.length = 0;
  currentShotIndex = -1;

  startPauseBtn.textContent = 'Start';
  startPauseBtn.className = 'start';
  nextShotBtn.disabled = true;
  updateTimerDisplay();
  renderShots();
  updateShotTextLines(false);
}

/* ===== RENDER SHOTS ===== */
function renderShots() {
  shotsList.innerHTML = '';
  if (shots.length === 0) {
    noShotsMsg.style.display = 'block';
    copyColumnBtn.disabled = true;
    copyRowBtn.disabled = true;
    copyListBtn.disabled = true;
    return;
  }
  noShotsMsg.style.display = 'none';
  copyColumnBtn.disabled = false;
  copyRowBtn.disabled = false;
  copyListBtn.disabled = false;

  shots.forEach((shot, i) => {
    // We'll make a .shot-item with 3 sections:
    // .shot-number, .shot-time, .shot-text
    const li = document.createElement('li');
    li.className = 'shot-item';

    if (i === currentShotIndex) {
      li.classList.add('highlighted');
    }

    // Shot number
    const divNumber = document.createElement('div');
    divNumber.className = 'shot-number';
    divNumber.textContent = `Shot ${i+1}`;

    // Time
    const divTime = document.createElement('div');
    divTime.className = 'shot-time';
    // If start/end set, format them. If partially or not at all set, omit
    let timeStr = '';
    if (shot.start !== undefined && shot.end !== undefined) {
      timeStr = `${formatTime(shot.start)} - ${formatTime(shot.end)}`;
    } else if (shot.start !== undefined) {
      timeStr = formatTime(shot.start);
    } else {
      timeStr = ''; // blank if none
    }
    divTime.textContent = timeStr;

    // Text
    const divText = document.createElement('div');
    divText.className = 'shot-text';
    divText.textContent = shot.text || '';

    li.appendChild(divNumber);
    li.appendChild(divTime);
    li.appendChild(divText);

    shotsList.appendChild(li);
  });

  // Auto-scroll to keep highlight visible
  if (currentShotIndex >= 0 && currentShotIndex < shots.length) {
    const item = shotsList.children[currentShotIndex];
    if (item) {
      const itemOffset = item.offsetTop;
      const containerHeight = shotsScroll.clientHeight;
      const desiredTop = itemOffset - containerHeight * 0.25;
      shotsScroll.scrollTo({
        top: desiredTop,
        behavior: 'smooth'
      });
    }
  }
}

/* ===== CURRENT & NEXT SHOT TEXT LINES (CAROUSEL) ===== */
function updateShotTextLines(doRoll) {
  let idxCur = currentShotIndex;
  // If not started => show first shot text in lineNext, none in lineCurrent
  if (idxCur < 0) {
    shotLineCurrent.textContent = '';
    shotLineNext.textContent = shots.length ? (shots[0].text || '') : '';
  } else {
    if (idxCur >= shots.length) idxCur = shots.length - 1;
    shotLineCurrent.textContent = shots[idxCur].text || '';
    const idxN = idxCur + 1;
    shotLineNext.textContent = (idxN < shots.length) ? (shots[idxN].text || '') : '';
  }

  if (doRoll) {
    rollShotText();
  } else {
    currentTextInner.classList.remove('roll', 'roll-done');
  }
}

function rollShotText() {
  // 1) add .roll, after 600ms remove it but add .roll-done
  currentTextInner.classList.remove('roll-done');
  currentTextInner.classList.add('roll');
  setTimeout(() => {
    currentTextInner.classList.remove('roll');
    currentTextInner.classList.add('roll-done');
    // remove roll-done after next frame if you want subsequent rolls
    requestAnimationFrame(() => {
      currentTextInner.classList.remove('roll-done');
    });
  }, 600);
}

/* ===== COPY FUNCTIONS ===== */
async function copyText(text) {
  // Hide any leftover hidden area
  hiddenCopyArea.style.display = 'block';
  hiddenCopyArea.value = text;
  hiddenCopyArea.select();
  hiddenCopyArea.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch(e) {
    console.warn('Fallback copy failed:', e);
  }
  hiddenCopyArea.style.display = 'none';

  // Attempt the modern API second, if you prefer the other way around, that's also possible
  if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch(e) {
      console.warn('Clipboard API failed:', e);
    }
  }
  return ok;
}

function copyAsColumn() {
  const lines = shots.map(s => {
    if (s.start !== undefined && s.end !== undefined) {
      return `${formatTime(s.start)} - ${formatTime(s.end)}`;
    } else if (s.start !== undefined) {
      return formatTime(s.start);
    }
    return '';
  });
  const text = lines.join('\n');
  copyText(text).then(ok => alert(ok ? 'Copied as column!' : 'Copy failed.'));
}
function copyAsRow() {
  const lines = shots.map(s => {
    if (s.start !== undefined && s.end !== undefined) {
      return `${formatTime(s.start)} - ${formatTime(s.end)}`;
    } else if (s.start !== undefined) {
      return formatTime(s.start);
    }
    return '';
  });
  const text = lines.join('\t');
  copyText(text).then(ok => alert(ok ? 'Copied as row!' : 'Copy failed.'));
}
function copyAsList() {
  const lines = shots.map((s, i) => {
    if (s.start !== undefined && s.end !== undefined) {
      return `Shot ${i+1}: ${formatTime(s.start)} - ${formatTime(s.end)}`;
    } else if (s.start !== undefined) {
      return `Shot ${i+1}: ${formatTime(s.start)}`;
    }
    return `Shot ${i+1}:`;
  });
  const text = lines.join('\n');
  copyText(text).then(ok => alert(ok ? 'Copied as list!' : 'Copy failed.'));
}

/* ===== PASTE TEXTS ===== */
async function pasteTexts() {
  try {
    const str = await navigator.clipboard.readText();
    if (!str) {
      alert('Clipboard is empty or blocked.');
      return;
    }

    const lines = str.split('\n').map(l => l.trim()).filter(l => l !== '');
    let texts;
    if (lines.length > 1) {
      texts = lines;
    } else {
      // single line => try tab
      const singleLine = lines.length === 1 ? lines[0] : '';
      const items = singleLine.split('\t').map(i => i.trim()).filter(i => i !== '');
      texts = items.length ? items : [];
    }
    if (!texts.length) {
      alert('Could not parse any lines from clipboard');
      return;
    }

    // expand shots if needed
    if (shots.length < texts.length) {
      const needed = texts.length - shots.length;
      for (let i=0; i<needed; i++) {
        shots.push({ text: '', start: undefined, end: undefined });
      }
    }
    // fill
    const fillCount = Math.min(shots.length, texts.length);
    for (let i=0; i<fillCount; i++) {
      shots[i].text = texts[i];
    }

    renderShots();
    updateShotTextLines(false);
    alert(`Pasted ${texts.length} text items. Created or updated ${fillCount} shots.`);
  } catch(e) {
    console.error('Failed to read from clipboard', e);
    alert('Failed to read from clipboard: ' + e);
  }
}

/* ===== EVENT HANDLERS ===== */
startPauseBtn.addEventListener('click', startTimer);
nextShotBtn.addEventListener('click', nextShot);

resetTimesBtn.addEventListener('click', resetTimes);
resetAllBtn.addEventListener('click', resetAll);

pasteTextsBtn.addEventListener('click', pasteTexts);
copyColumnBtn.addEventListener('click', copyAsColumn);
copyRowBtn.addEventListener('click', copyAsRow);
copyListBtn.addEventListener('click', copyAsList);

// Init
updateTimerDisplay();
renderShots();

// No “current shot,” so we show next line if there's a first shot
shotLineCurrent.textContent = '';
shotLineNext.textContent = shots.length ? (shots[0].text || '') : '';
