const promptWord = document.getElementById('prompt-word');
const targetFormLabel = document.getElementById('target-form-label');
const vocabInput = document.getElementById('vocab-input');
const englishContainer = document.getElementById('english-container');
const englishInput = document.getElementById('english-input');
const feedback = document.getElementById('feedback');
const romanjiConversion = document.getElementById('romanji-conversion');
const correctAnswer = document.getElementById('correct-answer');
const checkBtn = document.getElementById('check-btn');

let current = null;
let kDictionary = null;
let nextWordTimeout = null;

const kEnglish = 'english root';

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

  randomQuestion() {
    return new Question(
      this,
      this.tasks.randomValueWhere((t) => t.form == kEnglish),
      this.tasks.randomValueWhere((t) => t.form != kEnglish),
    );
  }
  getTask(form) { return this.tasks.getOrInsert(form, () => new Task(form)); }
  addAnswer(word, form) {
    if (form == this.form) {
      // Don't add answers of the same form as the base word.
      return;
    }
    this.getTask(form).answers.add(word);
  }
}

class Question {
  constructor(word, englishTask, japaneseTask) {
    this.word = word;
    this.englishTask = englishTask;
    this.japaneseTask = japaneseTask;
  }
}

function createDictionary(dicts) {
  const d = new ArrayMap();
  function key(word, form, kind) { return word + '\t' + form + '\t' + kind; }
  function addOne(kind, wordQ, formQ, wordA, formA) {
    if (formQ == kEnglish) {
      wordA = cleanEnglishAnswer(wordA);
    }
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
        flat.push([kEnglish, e]);
      }
      for (const [form, words] of forms) {
        for (const word of words) flat.push([form, word]);
      }
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
    [kMetaDict.raw('g1-verbs'), 'godan verb'],
    [kMetaDict.raw('g2-verbs'), 'ichidan verb'],
    [kMetaDict.raw('irr-verbs'), 'irregular verb'],
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

  englishInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (checkBtn.textContent === 'Check') {
        vocabInput.focus();
      } else {
        nextWord();
      }
    }
  });

  vocabInput.addEventListener('input', (e) => {
    const val = vocabInput.value.trim().toLowerCase();
    const converted = toHiragana(val, false);
    if (converted && converted !== val && val.length > 0) {
      romanjiConversion.textContent = converted;
    } else {
      romanjiConversion.textContent = '';
    }
  });

  vocabInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (checkBtn.textContent === 'Check') {
        checkAnswer();
      } else {
        nextWord();
      }
    }
  });

  checkBtn.addEventListener('click', () => {
    if (checkBtn.textContent === 'Check') {
      checkAnswer();
    } else {
      nextWord();
    }
  });
}

function nextWord() {
  clearTimeout(nextWordTimeout);
  current = kDictionary.randomValue().randomQuestion();

  const hasEnglishAnswer = current.englishTask != null;
  const hasJapaneseAnswer = current.japaneseTask != null;

  englishContainer.classList.toggle('hidden', !hasEnglishAnswer);

  // TODO: Properly support hiding the japanese answer section, and hiragana
  // keyboard, when we have word task lists that might only contain english.

  // Show/hide keyboard
  document.getElementById('hiragana-keyboard')
      .classList.toggle('hidden', !hasJapaneseAnswer);

  // Update UI
  promptWord.textContent = current.word.word;
  targetFormLabel.textContent =
      `${hasEnglishAnswer ? 'and ' : ''}to ${current.japaneseTask.form} form:`;

  vocabInput.value = '';
  vocabInput.className = '';
  englishInput.value = '';
  englishInput.className = '';
  romanjiConversion.textContent = '';
  feedback.textContent = '';
  feedback.className = '';
  correctAnswer.textContent = '';
  checkBtn.textContent = 'Check';

  setTimeout(() => {
    if (hasEnglishAnswer) {
      englishInput.focus();
    } else {
      vocabInput.focus();
    }
  }, 10);
}

function checkAnswer() {
  let val = vocabInput.value.trim().toLowerCase();
  const converted = toHiragana(val, false);
  if (converted) val = converted;
  const isJapCorrect = current.japaneseTask.answers.has(val);

  let isEngCorrect = true;
  if (current.englishTask != null) {
    const engVal = englishInput.value.trim().toLowerCase();
    isEngCorrect = current.englishTask.answers.has(engVal);
  }

  const isCorrect = isJapCorrect && isEngCorrect;

  const extras = [];
  if (current.word.kind) extras.push(current.word.kind);

  const extraStr = extras.join(', ');

  if (isCorrect) {
    vocabInput.className = 'correct';
    englishInput.className = 'correct';
    feedback.textContent = 'Correct!';
    feedback.className = 'correct';
    correctAnswer.textContent = extraStr ? `Info: ${extraStr}` : '';
  } else {
    vocabInput.className = isJapCorrect ? 'correct' : 'incorrect';
    englishInput.className = isEngCorrect ? 'correct' : 'incorrect';
    feedback.textContent = 'Incorrect';
    feedback.className = 'incorrect';

    const correctStrs = [];
    if (current.englishTask != null && !isEngCorrect) {
      correctStrs.push(Array.from(current.englishTask.answers).join(' or '));
    }
    if (!isJapCorrect) {
      correctStrs.push(Array.from(current.japaneseTask.answers).join(' or '));
    }

    let answerStr = `Correct answer: ${correctStrs.join(', ')}`;
    if (extraStr) answerStr += ` (${extraStr})`;
    correctAnswer.textContent = answerStr;
  }
  checkBtn.textContent = 'Next Word';
}

init();
