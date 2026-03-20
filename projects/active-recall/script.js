const chapterData = {
    firstflight: [
        // Prose
        { id: 1, title: "A Letter to God", author: "G.L. Fuentes", type: "prose" },
        { id: 2, title: "Nelson Mandela: Long Walk to Freedom", author: "Nelson Mandela", type: "prose" },
        { id: 3, title: "Two Stories about Flying", author: "Liam O' Flaherty / Frederick Forsyth", type: "prose" },
        { id: 4, title: "From the Diary of Anne Frank", author: "Anne Frank", type: "prose" },
        { id: 5, title: "Glimpses of India", author: "Lucio Rodrigues / Lokesh Abrol / Arup K. Datta", type: "prose" },
        { id: 6, title: "Mijbil the Otter", author: "Gavin Maxwell", type: "prose" },
        { id: 7, title: "Madam Rides the Bus", author: "Vallikkannan", type: "prose" },
        { id: 8, title: "The Sermon at Benares", author: "Betty Renshaw", type: "prose" },
        { id: 9, title: "The Proposal", author: "Anton Chekhov", type: "prose" },
        // Poetry
        { id: 10, title: "Dust of Snow", author: "Robert Frost", type: "poetry" },
        { id: 11, title: "Fire and Ice", author: "Robert Frost", type: "poetry" },
        { id: 12, title: "A Tiger in the Zoo", author: "Leslie Norris", type: "poetry" },
        { id: 13, title: "How to Tell Wild Animals", author: "Carolyn Wells", type: "poetry" },
        { id: 14, title: "The Ball Poem", author: "John Berryman", type: "poetry" },
        { id: 15, title: "Amanda!", author: "Robin Klein", type: "poetry" },
        { id: 16, title: "The Trees", author: "Adrienne Rich", type: "poetry" },
        { id: 17, title: "Fog", author: "Carl Sandburg", type: "poetry" },
        { id: 18, title: "The Tale of Custard the Dragon", author: "Ogden Nash", type: "poetry" },
        { id: 19, title: "For Anne Gregory", author: "W.B. Yeats", type: "poetry" }
    ],
    footprints: [
        { id: 101, title: "A Triumph of Surgery", author: "James Herriot", type: "prose" },
        { id: 102, title: "The Thief's Story", author: "Ruskin Bond", type: "prose" },
        { id: 103, title: "The Midnight Visitor", author: "Robert Arthur", type: "prose" },
        { id: 104, title: "A Question of Trust", author: "Victor Canning", type: "prose" },
        { id: 105, title: "Footprints without Feet", author: "H.G. Wells", type: "prose" },
        { id: 106, title: "The Making of a Scientist", author: "Robert W. Peterson", type: "prose" },
        { id: 107, title: "The Necklace", author: "Guy de Maupassant", type: "prose" },
        { id: 108, title: "Bholi", author: "K.A. Abbas", type: "prose" },
        { id: 109, title: "The Book That Saved the Earth", author: "Claire Boiko", type: "prose" }
    ]
};

let currentBook = 'firstflight';
let currentFilter = 'all';
let searchQuery = '';
let masteredIds = new Set();
let revealedIds = new Set();
let streak = 0;
let isTestMode = false;
let testModeType = 'recall'; 

let testHistory = [];
let testHistoryIndex = -1;
let currentTestPool = [];
let autoAdvanceTimer = null;

let lastQuizScore = 0;
let lastQuizTotal = 0;
let currentCycleCorrect = 0;
let currentCycleTotal = 0;

function playAudioFeedback(type) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    const now = context.currentTime;

    if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); 
        oscillator.frequency.exponentialRampToValueAtTime(880.00, now + 0.1); 
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    } else if (type === 'error') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220.00, now); 
        oscillator.frequency.exponentialRampToValueAtTime(110.00, now + 0.2); 
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    } else if (type === 'click') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, now);
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    }
    oscillator.start();
    oscillator.stop(now + 0.6);
}

function renderGrid() {
    const grid = document.getElementById('chapter-grid');
    const empty = document.getElementById('empty-state');
    const items = getFilteredItems();
    grid.innerHTML = '';
    document.getElementById('item-count').innerText = `${items.length} Chapters`;
    if (items.length === 0) { grid.classList.add('hidden'); empty.classList.remove('hidden'); }
    else { grid.classList.remove('hidden'); empty.classList.add('hidden'); items.forEach((item, idx) => grid.appendChild(createCard(item, false, idx * 30))); }
    updateUIStats();
}

function getFilteredItems() {
    let baseItems = currentBook === 'all' ? [...chapterData.firstflight, ...chapterData.footprints] : chapterData[currentBook];
    return baseItems.filter(item => {
        const matchesFilter = currentFilter === 'all' || item.type === currentFilter;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });
}

function createCard(item, isLarge = false, delay = 0, forceUnflipped = false) {
    const isMastered = masteredIds.has(item.id);
    const isRevealed = forceUnflipped ? false : revealedIds.has(item.id);
    const card = document.createElement('div');
    card.className = `card-flip w-full ${isLarge ? 'h-[350px]' : 'h-[220px]'} ${isMastered ? 'is-mastered-card' : ''}`;
    card.style.animation = `popIn 0.5s ease backwards ${delay}ms`;
    card.innerHTML = `
        <div class="card-inner w-full h-full ${isRevealed ? 'is-flipped' : ''}" onclick="flipCard(this, ${JSON.stringify(item).replace(/"/g, '&quot;')}, ${isLarge})">
            <div class="card-front">
                <div class="flex items-center justify-between w-full mb-auto">
                    <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${item.type === 'prose' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}">
                        ${item.type}
                    </span>
                    ${isMastered ? '<div class="mastered-badge px-2 py-0.5 rounded text-[10px] font-bold"><i class="fas fa-crown"></i></div>' : ''}
                </div>
                <h3 class="${isLarge ? 'text-3xl' : 'text-xl'} font-extrabold text-center px-4 tracking-tight">${item.title}</h3>
                <div class="mt-auto flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <span>Reveal Author</span>
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
            <div class="card-back">
                <div class="mb-auto text-[10px] font-black uppercase tracking-widest opacity-60">Created By</div>
                <div class="${isLarge ? 'text-4xl' : 'text-2xl'} font-black text-center px-4 leading-tight">${item.author}</div>
                <div class="mt-auto w-full flex gap-2">
                    <button onclick="toggleMastery(event, ${item.id})" class="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                        ${isMastered ? 'Undo' : 'Mastered'}
                    </button>
                </div>
            </div>
        </div>`;
    return card;
}

function flipCard(el, item, isLarge) {
    const wasFlipped = el.classList.contains('is-flipped');
    playAudioFeedback('click');
    el.classList.toggle('is-flipped');
    if (!wasFlipped) {
        revealedIds.add(item.id);
        updateUIStats();
        if (isTestMode && isLarge && testModeType === 'recall') {
            streak++;
            document.getElementById('streak-count').innerText = streak;
            document.getElementById('test-timer-status').innerHTML = '<i class="fas fa-magic fa-spin mr-2"></i> Auto-next in 2s...';
            if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = setTimeout(() => { if (isTestMode) nextTestItem(); }, 2000);
        }
    } else if (isTestMode && isLarge && autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
        document.getElementById('test-timer-status').innerHTML = '<span class="text-slate-400">Review Mode</span>';
    }
}

function toggleMastery(e, id) {
    e.stopPropagation();
    playAudioFeedback('click');
    if (masteredIds.has(id)) masteredIds.delete(id);
    else { 
        masteredIds.add(id); 
        if (!isTestMode) confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: ['#4f46e5', '#10b981'] }); 
    }
    updateUIStats();
    if (!isTestMode) renderGrid();
}

function updateUIStats() {
    const total = chapterData.firstflight.length + chapterData.footprints.length;
    const mastered = masteredIds.size;
    const percent = Math.round((mastered / total) * 100);
    document.getElementById('mastery-percent').innerText = `${percent}%`;
    document.getElementById('stat-mastered').innerText = mastered;
    document.getElementById('stat-revealed').innerText = revealedIds.size;
    document.getElementById('global-progress').style.width = `${percent}%`;
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function startTestMode(type) {
    const list = getFilteredItems();
    if (list.length === 0) return;
    isTestMode = true;
    testModeType = type;
    streak = 0;
    currentCycleCorrect = 0;
    currentCycleTotal = list.length;
    testHistory = [];
    testHistoryIndex = -1;
    currentTestPool = shuffle(list);
    document.getElementById('test-view').classList.add('hidden');
    document.getElementById('quiz-view').classList.add('hidden');
    document.getElementById('results-view').classList.add('hidden');
    if (type === 'recall') document.getElementById('test-view').classList.remove('hidden');
    else document.getElementById('quiz-view').classList.remove('hidden');
    nextTestItem();
}

function exitTestMode() {
    isTestMode = false;
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    document.getElementById('test-view').classList.add('hidden');
    document.getElementById('quiz-view').classList.add('hidden');
    document.getElementById('results-view').classList.add('hidden');
    renderGrid();
}

function nextTestItem() {
    const list = getFilteredItems();
    if (list.length === 0) return exitTestMode();
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    if (testHistoryIndex < testHistory.length - 1) {
        testHistoryIndex++;
        const item = testHistory[testHistoryIndex];
        if (testModeType === 'recall') renderRecallCard(item);
        else renderQuizQuestion(item);
        updateUndoButton();
        return;
    }
    if (currentTestPool.length === 0) {
        if (testModeType === 'quiz') { showResults(); return; }
        else currentTestPool = shuffle(list);
    }
    const nextItem = currentTestPool.pop();
    testHistory.push(nextItem);
    testHistoryIndex = testHistory.length - 1;
    if (testModeType === 'recall') renderRecallCard(nextItem);
    else renderQuizQuestion(nextItem);
    updateUndoButton();
}

function renderRecallCard(item) {
    document.getElementById('test-timer-status').innerText = '';
    const container = document.getElementById('test-card-container');
    container.innerHTML = '';
    container.appendChild(createCard(item, true, 0, true));
}

function renderQuizQuestion(item) {
    const currentQ = testHistoryIndex + 1;
    const totalQ = currentCycleTotal;
    const pct = Math.round((currentQ / totalQ) * 100);
    document.getElementById('quiz-progress-label').innerText = `Question ${currentQ} of ${totalQ}`;
    document.getElementById('quiz-progress-percent').innerText = `${pct}%`;
    document.getElementById('quiz-progress-bar').style.width = `${pct}%`;
    const chapterEl = document.getElementById('quiz-chapter-name');
    const gridEl = document.getElementById('quiz-options-grid');
    const feedbackEl = document.getElementById('quiz-feedback');
    feedbackEl.innerText = '';
    chapterEl.innerText = item.title;
    gridEl.innerHTML = '';
    const pool = getFilteredItems();
    const allAuthors = [...new Set(pool.map(i => i.author))];
    const uniqueOthers = allAuthors.filter(a => a !== item.author);
    const distractors = shuffle(uniqueOthers).slice(0, 3);
    const options = shuffle([item.author, ...distractors]);
    options.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.className = "quiz-option bg-white border border-slate-100 p-8 rounded-3xl font-bold text-slate-700 text-lg shadow-sm flex items-center justify-between text-left group animate-pop";
        btn.style.animationDelay = `${idx * 100}ms`;
        btn.innerHTML = `<div class="flex items-center gap-4"><span>${option}</span></div><i class="fas fa-chevron-right text-xs opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"></i>`;
        btn.onclick = () => handleQuizSelection(btn, option, item.author);
        gridEl.appendChild(btn);
    });
}

function handleQuizSelection(btn, selected, correct) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const allButtons = document.querySelectorAll('.quiz-option');
    allButtons.forEach(b => b.classList.add('disabled', 'pointer-events-none'));
    if (selected === correct) {
        playAudioFeedback('success'); btn.classList.add('correct');
        feedbackEl.innerHTML = '<span class="text-emerald-500 font-black"><i class="fas fa-check-circle mr-2"></i> Correct!</span>';
        streak++; currentCycleCorrect++; document.getElementById('streak-count').innerText = streak;
        confetti({ particleCount: 20, spread: 30, origin: { y: 0.8 }, colors: ['#10b981', '#ffffff'] });
    } else {
        playAudioFeedback('error'); btn.classList.add('incorrect');
        feedbackEl.innerHTML = `<span class="text-red-500 font-bold"><i class="fas fa-times-circle mr-2"></i> Answer: ${correct}</span>`;
        streak = 0; document.getElementById('streak-count').innerText = streak;
        allButtons.forEach(b => { if (b.innerText.trim() === correct) b.classList.add('correct'); });
    }
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => { if (isTestMode) nextTestItem(); }, 2000);
}

function showResults() {
    document.getElementById('quiz-view').classList.add('hidden');
    document.getElementById('results-view').classList.remove('hidden');
    const oldScoreBar = document.getElementById('old-score-bar');
    const newScoreBar = document.getElementById('new-score-bar');
    const oldScoreText = document.getElementById('old-score-text');
    const newScoreText = document.getElementById('new-score-text');
    const newHeight = (currentCycleCorrect / currentCycleTotal) * 100;
    const oldHeight = lastQuizTotal > 0 ? (lastQuizScore / lastQuizTotal) * 100 : 0;
    setTimeout(() => { newScoreBar.style.height = `${newHeight}%`; oldScoreBar.style.height = `${oldHeight}%`; }, 100);
    newScoreText.innerText = `${currentCycleCorrect}/${currentCycleTotal}`;
    oldScoreText.innerText = lastQuizTotal > 0 ? `${lastQuizScore}/${lastQuizTotal}` : "None";
    if (currentCycleCorrect >= lastQuizScore) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    lastQuizScore = currentCycleCorrect; lastQuizTotal = currentCycleTotal;
}

function restartQuizCycle() { startTestMode('quiz'); }

function undoLastChapter() {
    if (testHistoryIndex <= 0) return;
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    testHistoryIndex--;
    const item = testHistory[testHistoryIndex];
    if (testModeType === 'recall') renderRecallCard(item);
    else renderQuizQuestion(item);
    updateUndoButton();
}

function updateUndoButton() {
    const btn = document.getElementById('undo-btn');
    if (btn) btn.disabled = testHistoryIndex <= 0;
}

function confirmReset() {
    if (confirm("Reset all progress?")) {
        masteredIds.clear(); revealedIds.clear(); streak = 0; lastQuizScore = 0; lastQuizTotal = 0;
        document.getElementById('streak-count').innerText = "0";
        updateUIStats(); if (isTestMode) exitTestMode(); else renderGrid();
    }
}

function changeBook(book) {
    currentBook = book;
    document.querySelectorAll('.book-btn').forEach(btn => btn.className = "book-btn p-3 rounded-2xl border-2 transition-all font-bold text-sm flex flex-col items-center gap-2 border-slate-100 text-slate-400 hover:bg-slate-50");
    const btnAll = document.getElementById('btn-all');
    btnAll.className = "book-btn col-span-2 p-3 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-3 border-slate-100 text-slate-400 hover:bg-slate-50";
    if (book === 'all') {
        btnAll.className = "book-btn col-span-2 p-3 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-3 border-indigo-600 bg-indigo-50 text-indigo-700";
        document.getElementById('view-title').innerText = "Combined Library";
    } else {
        document.getElementById(`btn-${book}`).className = "book-btn p-3 rounded-2xl border-2 transition-all font-bold text-sm flex flex-col items-center gap-2 border-indigo-600 bg-indigo-50 text-indigo-700";
        document.getElementById('view-title').innerText = (book === 'firstflight' ? "First Flight" : "Footprints");
    }
    if (isTestMode) startTestMode(testModeType); else renderGrid();
}

function setFilter(f) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.className = "filter-btn px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase transition-all bg-white text-slate-400 border border-slate-100 hover:bg-slate-50");
    document.getElementById(`filter-${f}`).className = "filter-btn px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase transition-all bg-indigo-600 text-white shadow-md shadow-indigo-100";
    if (isTestMode) startTestMode(testModeType); else renderGrid();
}

function handleSearch() {
    searchQuery = document.getElementById('search-box').value;
    if (!isTestMode) renderGrid();
}

window.onload = renderGrid;
// Preserved the dynamic style injection from your original JS to ensure it works exactly the same
const style = document.createElement('style');
style.innerHTML = `@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`;
document.head.appendChild(style);
