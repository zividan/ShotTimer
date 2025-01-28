/* ============ STATE ============ */
let elapsedTime = 0;
let isRunning = false;
let startTime = null;
let timerInterval = null;

// Each shot: { text: string, start: number|undefined, end: number|undefined }
const shots = [];
let currentShotIndex = -1; // highlight index in shot list

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
// 1) Renamed from “copyListBtn” to “copyAudioBtn”
const copyAudioBtn    = document.getElementById('copyAudioBtn');

const hiddenCopyArea  = document.getElementById('hiddenCopyArea');

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

// Called ~10 times a second when running
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

    // If we have shots but none highlighted, highlight the first
    if (shots.length > 0 && currentShotIndex < 0) {
      currentShotIndex = 0;
      // set start if not set
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
}

/* ===== NEXT SHOT ===== */
function nextShot() {
  if (currentShotIndex < 0 || currentShotIndex >= shots.length) {
    alert('No available shot to set. Please paste texts or add shots first.');
    return;
  }
  // If current shot has no start, set it now
  if (shots[currentShotIndex].start === undefined) {
    shots[currentShotIndex].start = elapsedTime;
  }
  // Mark its end
  shots[currentShotIndex].end = elapsedTime;

  // Move to next shot
  const nextIndex = currentShotIndex + 1;
  if (nextIndex >= shots.length) {
    // 2) No more shots => also stop the counter
    alert('No more shots to highlight – all recorded!');
    stopCounter();
  } else {
    currentShotIndex = nextIndex;
    if (shots[currentShotIndex].start === undefined) {
      shots[currentShotIndex].start = elapsedTime;
    }
    renderShots();
  }
}

/* Helper to stop the timer */
function stopCounter() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isRunning = false;
  startPauseBtn.textContent = 'Start';
  startPauseBtn.className = 'start';
  nextShotBtn.disabled = true;
  updateTimerDisplay();
  renderShots();
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
}

/* ===== RENDER SHOTS (highlight the 'currentShotIndex') ===== */
function renderShots() {
  shotsList.innerHTML = '';
  if (shots.length === 0) {
    noShotsMsg.style.display = 'block';
    copyColumnBtn.disabled = true;
    copyRowBtn.disabled = true;
    copyAudioBtn.disabled = true;
    return;
  }
  noShotsMsg.style.display = 'none';
  copyColumnBtn.disabled = false;
  copyRowBtn.disabled = false;
  copyAudioBtn.disabled = false;

  shots.forEach((shot, i) => {
    const li = document.createElement('li');
    li.className = 'shot-item';

    if (i === currentShotIndex) {
      li.classList.add('highlighted');
    }

    // 3 sections: shot-number, shot-time, shot-text
    const divNumber = document.createElement('div');
    divNumber.className = 'shot-number';
    divNumber.textContent = `Shot ${i+1}`;

    const divTime = document.createElement('div');
    divTime.className = 'shot-time';
    let timeStr = '';
    if (shot.start !== undefined && shot.end !== undefined) {
      timeStr = `${formatTime(shot.start)} - ${formatTime(shot.end)}`;
    } else if (shot.start !== undefined) {
      timeStr = formatTime(shot.start);
    }
    divTime.textContent = timeStr;

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

/* ===== COPY FUNCTIONS ===== */
async function copyText(text) {
  // Attempt modern API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch(e) {
      console.warn('Modern clipboard failed, fallback to hidden area', e);
    }
  }

  // fallback
  hiddenCopyArea.style.display = 'block';
  hiddenCopyArea.value = text;
  hiddenCopyArea.select();
  hiddenCopyArea.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch(e) {
    console.warn('Fallback copy also failed:', e);
  }
  hiddenCopyArea.style.display = 'none';
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

/* 1) 'Copy for Audio' => tab separated: timing in col A, text in col B */
function copyAudio() {
  // For each shot => "timing\ttext"
  // timing => "start - end" or just "start"
  const lines = shots.map(s => {
    let timing = '';
    if (s.start !== undefined && s.end !== undefined) {
      timing = `${formatTime(s.start)} - ${formatTime(s.end)}`;
    } else if (s.start !== undefined) {
      timing = formatTime(s.start);
    }
    const txt = s.text || '';
    return `${timing}\t${txt}`;
  });
  const finalText = lines.join('\n');
  copyText(finalText).then(ok => {
    alert(ok ? 'Copied for audio!' : 'Copy failed.');
  });
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
// 1) We use "copyAudio" here
copyAudioBtn.addEventListener('click', copyAudio);

// Init
updateTimerDisplay();
renderShots();
