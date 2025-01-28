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

// Tick the timer ~10 times a second
function tick() {
  if (startTime !== null) {
    elapsedTime = Date.now() - startTime;
    updateTimerDisplay();
  }
}

/* ======= START/PAUSE ======= */
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

/* ======= NEXT SHOT ======= */
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
  // Perform the rolling text animation
  updateShotTextLines(true);
}

/* ======= RESET TIMES ONLY ======= */
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

/* ======= RESET ALL ======= */
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

/* ======= RENDER SHOTS ======= */
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
    const li = document.createElement('li');
    li.className = 'shot-item';
    if (i === currentShotIndex) {
      li.classList.add('highlighted');
    }

    let label = `Shot ${i+1}: `;
    // Show blank if time not set
    if (shot.start !== undefined && shot.end !== undefined) {
      label += `${formatTime(shot.start)} - ${formatTime(shot.end)}`;
    } else if (shot.start === undefined && shot.end === undefined) {
      label += ``; // blank
    } else {
      // partial
      const st = (shot.start !== undefined) ? formatTime(shot.start) : '';
      const en = (shot.end   !== undefined) ? formatTime(shot.end)   : '';
      label += `${st}${(st && en) ? ' - ' : ''}${en}`;
    }

    const shotLabelDiv = document.createElement('div');
    shotLabelDiv.textContent = label;

    const textSpan = document.createElement('span');
    textSpan.className = 'shot-text';
    textSpan.textContent = shot.text || '';

    li.appendChild(shotLabelDiv);
    li.appendChild(textSpan);
    shotsList.appendChild(li);
  });

  // Auto-scroll so highlighted shot is visible with ~3 shots below
  if (currentShotIndex >= 0 && currentShotIndex < shots.length) {
    const item = shotsList.children[currentShotIndex];
    if (item) {
      const itemOffset = item.offsetTop;
      const containerHeight = shotsScroll.clientHeight;
      // we want the shot to appear ~1/4 from top
      const desiredTop = itemOffset - containerHeight * 0.25;
      shotsScroll.scrollTo({
        top: desiredTop,
        behavior: 'smooth'
      });
    }
  }
}

/* ======= CURRENT & NEXT SHOT TEXT LINES (ROLL ANIMATION) ======= */
function updateShotTextLines(doRoll) {
  // We'll show the 'current' shot text in shotLineCurrent, 'next' shot text in shotLineNext
  // If we haven't started, currentShotIndex < 0 => current is '', next is first shot if any
  let idxCur = currentShotIndex;
  if (idxCur < 0) {
    // not started => no 'current'
    shotLineCurrent.textContent = '';
    if (shots.length > 0) {
      // next = first shot
      shotLineNext.textContent = shots[0].text || '';
    } else {
      shotLineNext.textContent = '';
    }
  } else {
    if (idxCur >= shots.length) idxCur = shots.length - 1; 
    shotLineCurrent.textContent = shots[idxCur].text || '';
    // next
    const idxN = idxCur + 1;
    if (idxN < shots.length) {
      shotLineNext.textContent = shots[idxN].text || '';
    } else {
      shotLineNext.textContent = '';
    }
  }

  if (doRoll) {
    currentTextInner.classList.add('roll');
    setTimeout(() => {
      currentTextInner.classList.remove('roll');
      currentTextInner.classList.add('roll-done');
      requestAnimationFrame(() => {
        currentTextInner.classList.remove('roll-done');
      });
    }, 600);
  } else {
    currentTextInner.classList.remove('roll');
  }
}

/* ======= COPY FUNCTIONS ======= */
async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('Clipboard API failed:', e);
    }
  }
  hiddenCopyArea.value = text;
  hiddenCopyArea.select();
  hiddenCopyArea.setSelectionRange(0, text.length);
  return document.execCommand('copy');
}

function copyAsColumn() {
  const lines = shots.map(s => {
    if (s.start !== undefined && s.end !== undefined) {
      return `${formatTime(s.start)} - ${formatTime(s.end)}`;
    }
    return '';
  });
  const text = lines.join('\n');
  copyText(text).then(ok => {
    alert(ok ? 'Copied as column!' : 'Copy failed.');
  });
}
function copyAsRow() {
  const lines = shots.map(s => {
    if (s.start !== undefined && s.end !== undefined) {
      return `${formatTime(s.start)} - ${formatTime(s.end)}`;
    }
    return '';
  });
  const text = lines.join('\t');
  copyText(text).then(ok => {
    alert(ok ? 'Copied as row!' : 'Copy failed.');
  });
}
function copyAsList() {
  const lines = shots.map((s, i) => {
    if (s.start !== undefined && s.end !== undefined) {
      return `Shot ${i+1}: ${formatTime(s.start)} - ${formatTime(s.end)}`;
    }
    return `Shot ${i+1}: `;
  });
  const text = lines.join('\n');
  copyText(text).then(ok => {
    alert(ok ? 'Copied as list!' : 'Copy failed.');
  });
}

/* ======= PASTE TEXTS ======= */
async function pasteTexts() {
  try {
    const str = await navigator.clipboard.readText();
    if (!str) {
      alert('Clipboard is empty or blocked.');
      return;
    }

    // parse by lines or tabs
    const lines = str.split('\n').map(l => l.trim()).filter(l => l !== '');
    let texts;
    if (lines.length > 1) {
      // multiple lines => column
      texts = lines;
    } else {
      // single line => row (tab separated)
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

/* ======= EVENT HANDLERS ======= */
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

// By default, no current shot => show next line as first shot if any
shotLineCurrent.textContent = '';
shotLineNext.textContent = shots.length ? (shots[0].text || '') : '';
