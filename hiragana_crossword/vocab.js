const taskDescription = document.getElementById('task-description');
const promptFormLabel = document.getElementById('prompt-form-label');
const promptWord = document.getElementById('prompt-word');
const targetFormLabel = document.getElementById('target-form-label');
const vocabInput = document.getElementById('vocab-input');
const feedback = document.getElementById('feedback');
const correctAnswer = document.getElementById('correct-answer');
const checkBtn = document.getElementById('check-btn');
const nextBtn = document.getElementById('next-btn');

let currentWord = null;
let currentTask = null;
let kDictionary = null;

class Task {
  constructor(form) {
    this.form = form;
    this.answers = new Set();
  }
}

class DictEntry {
  constructor(word, form, kind) {
    this.word = word;
    this.form = form;
    this.kind = kind;
    this.tasks = new ArrayMap();
  }

  randomTask() { return this.tasks.randomValue(); }
  getTask(form) { return this.tasks.getOrInsert(form, () => new Task(form)); }
  addAnswer(word, form) { this.getTask(form).answers.add(word); }
}

function createDictionary(dicts) {
  const d = new ArrayMap();
  function key(word, form, kind) { return word + '\t' + form + '\t' + kind; }
  function addOne(kind, wordQ, formQ, wordA, formA) {
    d.getOrInsert(
         key(wordQ, formQ, kind), () => new DictEntry(wordQ, formQ, kind))
        .addAnswer(wordA, formA);
  }
  function add(kind, word1, form1, word2, form2) {
    addOne(kind, word1, form1, word2, form2);
    addOne(kind, word2, form2, word1, form1);
  }
  function formSplit(word) {
    if (word == null) return null;
    const m = word.match(/(.*?)\s*\[([^\]]*)\]$/);
    return m ? [m[1], m[2]] : [null, null];
  }
  for (const [[_, raw], kind] of dicts) {
    // raw: Array<Tuple<Array<Str englishWordWithForm>, Str romanjiWord>>
    // g: Map<Str englishWordsJoinedByTabs, Map<Str form, Set<Str word>>>
    const g = new Map();
    for (const [eraw, jraw] of raw) {
      const eng = toArray(eraw).map((e) => e.toLowerCase());
      const jap = toArray(jraw)
                      .map(toHiragana)
                      .map((w) => cleanHiraganaAnswer(w, 1))
                      .filter((w) => w != null);
      const [_, form] = formSplit(eng[0]);
      const cleanEng = eng.map((e) => {
                            const [w, f] = formSplit(e);
                            console.assert(f == form, e, w, f, form);
                            return w;
                          })
                           .sort();
      const gridEntry = getOrInsert(g, cleanEng.join('\t'), () => new Map());
      const entrySet = getOrInsert(gridEntry, form, () => new Set());
      for (const j of jap) entrySet.add(j);
    }

    for (const [ee, forms] of g) {
      const flat = [];
      for (const e of ee.split('\t')) {
        flat.push(['english', e]);
      }
      for (const [form, words] of forms) {
        for (const word of words) flat.push([form, word]);
      }
      // console.log(flat);
      for (let i = 1; i < flat.length; ++i) {
        for (let j = 0; j < i; ++j) {
          const [fi, wi] = flat[i];
          const [fj, wj] = flat[j];
          add(kind, wi, fi, wj, fj);
        }
      }
    }
  }
  return d;
}

function init() {
  kDictionary = createDictionary([
    [kMetaDict.raw('verbs'), 'verb'],
  ]);

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

function nextWord() {
  currentWord = kDictionary.randomValue();
  currentTask = currentWord.randomTask();

  // Show/hide keyboard
  document.getElementById('hiragana-keyboard')
      .classList.toggle('hidden', currentTask.form === 'english');

  // Update UI
  taskDescription.textContent = `Convert the word:`;
  promptWord.textContent = currentWord.word;
  targetFormLabel.textContent = `to ${currentTask.form}:`;

  vocabInput.value = '';
  vocabInput.className = '';
  feedback.textContent = '';
  feedback.className = '';
  correctAnswer.textContent = '';
  vocabInput.focus();
}

function checkAnswer() {
  if (currentTask.answers.has(vocabInput.value.trim().toLowerCase())) {
    vocabInput.className = 'correct';
    feedback.textContent = 'Correct!';
    feedback.className = 'correct';
  } else {
    vocabInput.className = 'incorrect';
    feedback.textContent = 'Incorrect';
    feedback.className = 'incorrect';
    correctAnswer.textContent =
        `Correct answer: ${Array.from(currentTask.answers).join('or')}`;
  }
}

init();
