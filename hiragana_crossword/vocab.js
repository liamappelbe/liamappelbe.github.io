const taskDescription = document.getElementById('task-description');
const promptFormLabel = document.getElementById('prompt-form-label');
const promptWord = document.getElementById('prompt-word');
const targetFormLabel = document.getElementById('target-form-label');
const vocabInput = document.getElementById('vocab-input');
const feedback = document.getElementById('feedback');
const correctAnswer = document.getElementById('correct-answer');
const checkBtn = document.getElementById('check-btn');
const nextBtn = document.getElementById('next-btn');

const forms = [
  'english', 'present positive', 'present negative', 'past positive',
  'past negative', 'dictionary form', 'te form'
];

let currentWord = null;
let currentPromptForm = null;
let currentTargetForm = null;
let currentAnswer = null;
let kVerbDict = null;

function init() {
  kVerbDict = kMetaDict.select(n => n.includes('verbs')).formView();

  const keyboard = document.getElementById('hiragana-keyboard');
  buildHiraganaKeyboard(keyboard, (h) => {
    const start = vocabInput.selectionStart;
    const end = vocabInput.selectionEnd;
    const val = vocabInput.value;
    vocabInput.value = val.slice(0, start) + h + val.slice(end);
    vocabInput.selectionStart = vocabInput.selectionEnd = start + h.length;
    vocabInput.focus();
    vocabInput.dispatchEvent(new Event('input', {bubbles: true}));
  });

  nextWord();

  vocabInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (feedback.textContent === '') {
        checkAnswer();
      } else {
        nextWord();
      }
    }
  });

  checkBtn.addEventListener('click', checkAnswer);
  nextBtn.addEventListener('click', nextWord);
}

function randomPair(array) {
  const x = randInt(array.length);
  const y = randInt(array.length - 1);
  return [array[x], array[y < x ? y : y + 1]];
}

function nextWord() {
  currentWord = kVerbDict.randomEntry();
  [currentPromptForm, currentTargetForm] =
      randomPair(Array.from(currentWord.keys()));

  // Show/hide keyboard
  document.getElementById('hiragana-keyboard')
      .classList.toggle('hidden', currentTargetForm === 'english');

  const promptValue = pick(Array.from(currentWord.get(currentPromptForm)));
  currentAnswer = Array.from(currentWord.get(currentTargetForm)).sort();

  // Update UI
  taskDescription.textContent = `Convert the word:`;
  promptWord.textContent = promptValue;
  targetFormLabel.textContent = `to ${currentTargetForm}:`;

  vocabInput.value = '';
  vocabInput.className = '';
  feedback.textContent = '';
  feedback.className = '';
  correctAnswer.textContent = '';
  vocabInput.focus();
}

function checkAnswer() {
  const isCorrect = compareAnswers(vocabInput.value, currentAnswer);

  if (isCorrect) {
    vocabInput.className = 'correct';
    feedback.textContent = 'Correct!';
    feedback.className = 'correct';
  } else {
    vocabInput.className = 'incorrect';
    feedback.textContent = 'Incorrect';
    feedback.className = 'incorrect';
    correctAnswer.textContent = `Correct answer: ${currentAnswer.join('or')}`;
  }
}

function compareAnswers(user, target) {
  return target.some(t => t.trim().toLowerCase() === user.trim().toLowerCase());
}

init();
