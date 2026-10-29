const typingText = document.querySelector('.typing-text');
const input = document.querySelector('.input-field');
const time = document.querySelector('.time span b');
const mistakes = document.querySelector('.mistake span');
const wpm = document.querySelector('.wpm span');
const cpm = document.querySelector('.cpm span');
const acc = document.querySelector('.acc span');
const btn = document.querySelector('.foot .primary');
const bar = document.querySelector('.bar i');
const result = document.getElementById('result');
const bestEl = document.getElementById('best');

const paragraphs = [
  "Start your day with meditation for a peaceful mind. Even five quiet minutes can change how you handle the hours ahead. Write down three things you’re grateful for, and you will notice small joys that usually pass you by.",
  "Spend time with your family and cherish those moments, because they pass faster than we expect. Cook a meal for someone and share the joy of food. A simple dinner at a shared table often becomes the memory everyone talks about years later.",
  "Exercise regularly to keep your body healthy. You don’t need a gym or fancy equipment, just a walk, a few stretches, and the habit of showing up. Drink more water, sleep on time, and your energy will thank you within a week.",
  "Learn a new skill or hobby that excites you. It could be painting, coding, cooking, or playing an instrument. Progress feels slow at first, but every small practice session adds up, and one day you will look back surprised at how far you have come.",
  "Disconnect from social media for a day and enjoy the moment. Go outside, spend time in nature, and appreciate its beauty. The world looks different when your eyes are not fixed on a screen, and your mind finally gets room to breathe.",
  "Help someone in need, even in small ways. Hold a door, share your notes, or simply listen without interrupting. Compliment someone genuinely and make their day. Kindness costs almost nothing, yet it travels further than we can ever measure.",
  "Start a journal to document your thoughts and dreams. Write about what happened today, what worried you, and what you hope for next year. Years later, those pages will show you how much you have grown and what truly mattered.",
  "Reduce your plastic use to help the environment. Carry a cloth bag, refill your bottle, and say no to things you do not need. Donate clothes you don’t wear to charity, and give your old things a second life instead of a landfill.",
  "Read a book that inspires you to grow. A good book can teach patience, courage, and new ways of thinking. Even twenty pages a day adds up to dozens of books a year, and the person who finishes them is never quite the same.",
  "Clean your room or workspace to feel more organized. A tidy desk clears the mind and makes it easier to begin hard work. Smile at strangers and brighten their day, because a good mood is contagious and costs nothing to share.",
  "Write a letter to your future self. Tell them what you are working on, what scares you, and what you are proud of. Seal it and open it after a year. You will be amazed at how much has changed and how much you have survived.",
  "Good typing is a skill that grows with patience. Keep your wrists relaxed, look at the screen instead of the keys, and focus on accuracy before speed. Speed comes naturally once your fingers remember the path to every letter."
];

// Shuffled list so a paragraph does not repeat until all are used
let queue = [];
function nextParagraph() {
  if (!queue.length) queue = paragraphs.slice().sort(() => Math.random() - 0.5);
  return queue.pop();
}

let maxTime = 60;
let timer = null;
let startedAt = 0;
let finished = false;
let isTyping = false;

let charIndex = 0;    // position in the current paragraph
let wrongNow = 0;     // wrong letters in the current paragraph
let doneCorrect = 0;  // correct letters from paragraphs already completed
let mistake = 0;      // total mistakes in the whole test
let keystrokes = 0;   // total keys pressed in the whole test
let chars = [];

function getBest() {
  try { return +localStorage.getItem('typing-best') || 0; } catch (e) { return 0; }
}
function setBest(v) {
  try { localStorage.setItem('typing-best', v); } catch (e) {}
}
function showBest() {
  const b = getBest();
  bestEl.textContent = b || '–';
}

// Replaces the text on screen with a fresh paragraph
function loadParagraph() {
  typingText.innerHTML = nextParagraph().split('').map(c => `<span>${c}</span>`).join('');
  chars = typingText.querySelectorAll('span');
  chars[0].classList.add('active');
  typingText.scrollTop = 0;
}

function typeChar(ch) {
  const el = chars[charIndex];
  el.classList.remove('active');
  keystrokes++;
  if (el.textContent === ch) {
    el.classList.add('correct');
  } else {
    el.classList.add('incorrect');
    mistake++;
    wrongNow++;
  }
  charIndex++;
}

function backChar() {
  chars[charIndex].classList.remove('active');
  charIndex--;
  const el = chars[charIndex];
  if (el.classList.contains('incorrect')) wrongNow--;
  el.classList.remove('correct', 'incorrect');
}

function onInput() {
  if (finished) { input.value = ''; return; }

  let v = input.value.slice(0, chars.length);

  if (!isTyping && v.length) {
    isTyping = true;
    startedAt = performance.now();
    typingText.classList.remove('idle');
    timer = setInterval(tick, 200);
  }

  while (charIndex > v.length) backChar();
  while (charIndex < v.length) typeChar(v[charIndex]);
  input.value = v;

  // Paragraph complete: remove it and show the next one in its place
  if (charIndex === chars.length) {
    doneCorrect += charIndex - wrongNow;
    charIndex = 0;
    wrongNow = 0;
    input.value = '';
    loadParagraph();
  }

  // Keep the current line in view
  chars[charIndex].classList.add('active');
  const lh = parseFloat(getComputedStyle(typingText).lineHeight);
  const line = Math.round((chars[charIndex].offsetTop - chars[0].offsetTop) / lh);
  typingText.scrollTop = Math.max(0, (line - 1) * lh);

  updateStats();
}

function updateStats() {
  const correct = doneCorrect + charIndex - wrongNow;
  const mins = isTyping ? Math.max((performance.now() - startedAt) / 60000, 1 / 600) : 0;
  const w = mins ? Math.round((correct / 5) / mins) : 0;

  mistakes.textContent = mistake;
  cpm.textContent = correct;
  wpm.textContent = w;
  acc.textContent = (keystrokes ? Math.round((keystrokes - mistake) / keystrokes * 100) : 100) + '%';
}

function tick() {
  const elapsed = (performance.now() - startedAt) / 1000;
  const left = Math.max(0, maxTime - elapsed);
  time.textContent = Math.ceil(left);
  bar.style.transform = `scaleX(${left / maxTime})`;
  updateStats();
  if (left <= 0) finish();
}

function finish() {
  if (finished) return;
  finished = true;
  clearInterval(timer);

  const elapsed = Math.min((performance.now() - startedAt) / 1000, maxTime);
  const correct = doneCorrect + charIndex - wrongNow;
  const w = Math.round((correct / 5) / (Math.max(elapsed, 1) / 60));

  const prev = getBest();
  const isBest = w > prev;
  if (isBest) setBest(w);

  document.getElementById('rWpm').textContent = w;
  document.getElementById('rAcc').textContent = acc.textContent;
  document.getElementById('rCpm').textContent = correct;
  document.getElementById('rMis').textContent = mistake;
  document.getElementById('rBest').textContent = Math.max(w, prev);
  document.getElementById('badge').style.display = isBest && w > 0 ? 'inline-block' : 'none';

  result.classList.add('show');
  input.blur();
  document.getElementById('again').focus();
  showBest();
}

function reset() {
  clearInterval(timer);
  finished = false;
  isTyping = false;
  charIndex = 0;
  wrongNow = 0;
  doneCorrect = 0;
  mistake = 0;
  keystrokes = 0;
  input.value = '';

  time.textContent = maxTime;
  bar.style.transform = 'scaleX(1)';
  mistakes.textContent = 0;
  wpm.textContent = 0;
  cpm.textContent = 0;
  acc.textContent = '100%';

  typingText.classList.add('idle');
  result.classList.remove('show');
  loadParagraph();
  input.focus();
}

// Duration buttons
document.getElementById('durations').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  maxTime = +b.dataset.t;
  document.querySelectorAll('#durations button').forEach(x => x.classList.toggle('on', x === b));
  reset();
});

// Theme button
document.getElementById('theme').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = getComputedStyle(root).getPropertyValue('--bg').trim() === '#0f1626';
  root.dataset.theme = dark ? 'light' : 'dark';
});

input.addEventListener('input', onInput);
typingText.addEventListener('click', () => input.focus());

document.addEventListener('keydown', e => {
  if (e.key === 'Tab') { e.preventDefault(); reset(); return; }
  if (e.key === 'Escape') { reset(); return; }
  if (!finished && document.activeElement !== input && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    input.focus();
  }
});

btn.addEventListener('click', reset);
document.getElementById('again').addEventListener('click', reset);

showBest();
loadParagraph();
input.focus();