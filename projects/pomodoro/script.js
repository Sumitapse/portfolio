// Timer Constants & State
const DEFAULT_WORK_TIME = 25 * 60;
const DEFAULT_BREAK_TIME = 5 * 60;
const DIGIT_HEIGHT = 140; 

let timeLeft = DEFAULT_WORK_TIME;
let timerId = null;
let isWorkMode = true;
let isRunning = false;
let currentDigits = ["0", "0", "0", "0"];
let playStartedAt = null; // To track when the timer was started for sync

// UI Elements
const strips = [
    document.getElementById('m10'),
    document.getElementById('m1'),
    document.getElementById('s10'),
    document.getElementById('s1')
];
const spiralGrow = document.getElementById('spiral-grow');
const spiralGhost = document.getElementById('spiral-ghost');
const notification = document.getElementById('notification');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const shareBtn = document.getElementById('shareBtn');
const taskInput = document.getElementById('taskInput');
const focusText = document.getElementById('focusText');
const editMode = document.getElementById('editMode');
const focusMode = document.getElementById('focusMode');

// Spiral Generation
function generateSpiralPath() {
    const centerX = 100, centerY = 100, rotations = 6, points = 350;
    let d = `M ${centerX} ${centerY} `;
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2 * rotations;
        const radius = (i / points) * 92; 
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        d += `L ${x} ${y} `;
    }
    return d;
}

const pathData = generateSpiralPath();
spiralGhost.setAttribute('d', pathData);
spiralGrow.setAttribute('d', pathData);
const spiralLength = spiralGrow.getTotalLength();
spiralGrow.style.strokeDasharray = spiralLength;
spiralGrow.style.strokeDashoffset = spiralLength;

// Initialize Digits
strips.forEach(strip => {
    for(let i=0; i<=9; i++) {
        const div = document.createElement('div');
        div.className = 'digit';
        div.textContent = i;
        strip.appendChild(div);
    }
});

// Timer Logic
function updateTimerUI(force = false) {
    const mins = Math.max(0, Math.floor(timeLeft / 60));
    const secs = Math.max(0, timeLeft % 60);
    const digits = [
        Math.floor(mins / 10).toString(),
        (mins % 10).toString(),
        Math.floor(secs / 10).toString(),
        (secs % 10).toString()
    ];

    digits.forEach((digit, i) => {
        if (digit !== currentDigits[i] || force) {
            strips[i].style.transform = `translateY(-${parseInt(digit) * DIGIT_HEIGHT}px)`;
        }
    });
    currentDigits = digits;

    const total = isWorkMode ? DEFAULT_WORK_TIME : DEFAULT_BREAK_TIME;
    const progress = 1 - Math.max(0, timeLeft / total);
    spiralGrow.style.strokeDashoffset = spiralLength * (1 - Math.min(1, progress));
}

function showNotification(msg) {
    notification.textContent = msg;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// IMPROVED URL Sharing Logic (Calculates time offset)
function generateShareLink() {
    const params = new URLSearchParams();
    
    // If running, we calculate the time remaining based on the global timestamp
    if (isRunning && playStartedAt) {
        params.set('st', playStartedAt); // Start timestamp
        params.set('tl', timeLeft + Math.floor((Date.now() - playStartedAt) / 1000)); // Total time at start
    } else {
        params.set('t', timeLeft); // Static time if paused
    }
    
    params.set('m', isWorkMode ? 'w' : 'b');
    params.set('r', isRunning ? '1' : '0');
    params.set('tk', taskInput.value.trim() || focusText.textContent);
    
    const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
    
    // Copy to clipboard
    const textarea = document.createElement('textarea');
    textarea.value = shareUrl;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showNotification("Synced link copied! Open this to stay in sync.");
    } catch (err) {
        console.error("Copy failed", err);
    }
    document.body.removeChild(textarea);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('t') || params.has('st')) {
        const isPaused = params.get('r') === '0';
        isWorkMode = params.get('m') === 'w';
        const task = params.get('tk') || "";
        taskInput.value = task;
        focusText.textContent = task || "Deep Focus";

        if (isPaused) {
            timeLeft = parseInt(params.get('t'));
        } else {
            // Calculating offset for live sync
            const startTimestamp = parseInt(params.get('st'));
            const totalAtStart = parseInt(params.get('tl'));
            const elapsedSinceStart = Math.floor((Date.now() - startTimestamp) / 1000);
            
            timeLeft = totalAtStart - elapsedSinceStart;
            
            if (timeLeft <= 0) {
                showNotification("Session has already ended.");
                timeLeft = 0;
            } else {
                startLocalTimer(true); // resume calculated position
            }
        }
        
        updateTimerUI(true);
        showNotification("Successfully synced with session.");
    }
}

// Timer Control Functions
function startLocalTimer(isSyncLoad = false) {
    if (isRunning) return;
    isRunning = true;
    
    if (!isSyncLoad) {
        playStartedAt = Date.now();
    }

    editMode.classList.add('hidden');
    focusMode.classList.remove('hidden');
    focusText.textContent = taskInput.value.trim() || "Deep Focus";
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');

    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerUI();
        } else {
            clearInterval(timerId);
            isRunning = false;
            switchMode();
            startLocalTimer();
        }
    }, 1000);
}

function pauseLocalTimer() {
    clearInterval(timerId);
    isRunning = false;
    playStartedAt = null;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

function switchMode() {
    isWorkMode = !isWorkMode;
    timeLeft = isWorkMode ? DEFAULT_WORK_TIME : DEFAULT_BREAK_TIME;
    if (isRunning) playStartedAt = Date.now();
    showNotification(isWorkMode ? "Focus mode active." : "Break mode active.");
    updateTimerUI(true);
}

// Global Event Listeners
window.addTime = (mins) => {
    timeLeft += mins * 60;
    updateTimerUI();
    showNotification(`+${mins} Minutes Added`);
};

startBtn.onclick = () => startLocalTimer();
pauseBtn.onclick = pauseLocalTimer;
resetBtn.onclick = () => {
    pauseLocalTimer();
    isWorkMode = true;
    timeLeft = DEFAULT_WORK_TIME;
    editMode.classList.remove('hidden');
    focusMode.classList.add('hidden');
    updateTimerUI(true);
};

shareBtn.onclick = generateShareLink;

taskInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') startLocalTimer();
});

// Initialize display and check URL on load
window.onload = () => {
    updateTimerUI(true);
    loadFromURL();
};
