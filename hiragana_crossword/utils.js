function wait() { return new Promise(resolve => setTimeout(resolve, 0)); }
function randInt(n) { return Math.floor(Math.random() * n); }
function pick(array) { return array[randInt(array.length)]; }

function sameElements(itr1, itr2) {
  const s1 = new Set(itr1);
  if (!itr2.every((x) => s1.has(x))) return false;
  const s2 = new Set(itr2);
  return itr1.every((x) => s2.has(x))
}

function getOrInsert(map, key, fn) {
  if (!map.has(key)) {
    const val = fn();
    map.set(key, val);
    return val;
  }
  return map.get(key);
}

class MultiMapBuilder {
  constructor() { this._map = new Map(); }
  _poke(key) { return getOrInsert(this._map, key, () => new Set()); }

  add(key, value) {
    if (key != null && value != null) this._poke(key).add(value);
  }

  addAll(key, values) {
    if (key == null) return;
    const entry = this._poke(key);
    for (const value of values) {
      if (value != null) entry.add(value);
    }
  }

  build() {
    const m = new Map();
    for (const [key, values] of this._map.entries()) {
      m.set(key, Array.from(values).sort());
    }
    return new MultiMap(m);
  }
}

class MultiMap {
  constructor(map) {
    this._map = map;
    this._keys = Array.from(this._map.keys());
  }

  get(key) { return this._map.get(key); }
  has(key) { return this._map.has(key); }
  keys() { return this._keys; }
  randomKey() { return pick(this._keys); }

  randomValue(k) {
    const values = this._map.get(k);
    return values ? pick(values) : null;
  }
}

class Dictionary {
  // Raw is an array of [english, japanese] pairs. Both the english entry and
  // the japanese entry can be a single word or an array of words. The japanese
  // words are all in romanji.
  constructor(raw) {
    const jap = new MultiMapBuilder();  // Map from jap words to a set of eng.
    const eng = new MultiMapBuilder();  // Map from eng words to a set of jap.
    for (const entry of raw) {
      const [eraw, jraw] = entry;
      const e = toArray(eraw);
      const j = toArray(jraw).map(toHiragana);
      for (const word of e) eng.addAll(cleanEnglishAnswer(word), j);
      for (const word of j) jap.addAll(cleanHiraganaAnswer(word), e);
    }
    this._jap = new DictionaryView(jap.build());
    this._eng = new DictionaryView(eng.build());

    this._form = new DictionaryFormView(raw);
  }

  // Returns a set of English translations for a given Japanese word.
  japToEng(word) { return this._jap.get(word); }

  // Returns a set of Japanese translations for a given English word.
  engToJap(word) { return this._eng.get(word); }

  japView() { return this._jap; }
  engView() { return this._eng; }
  formView() { return this._form; }
}

class DictionaryView {
  constructor(dict) {
    this._dict = dict;  // Map from words to an array of translations.
    this._words = Array.from(this._dict.keys());

    // Map from unigrams to words and indices.
    const uni = new MultiMapBuilder();
    for (const w of this._words) {
      for (let i = 0; i < w.length - 1; i++) {
        uni.add(w[i], new Gram(w, i));
      }
    }
    this._uni = uni.build();

    // Map from ordered bigrams and distances to words and indices.
    const bi = new MultiMapBuilder();
    for (const w of this._words) {
      for (let i = 0; i < w.length - 1; i++) {
        for (let j = i + 1; j < w.length; ++j) {
          bi.add(w[i] + w[j] + (j - i), new Gram(w, i));
        }
      }
    }
    this._bi = bi.build();
  }

  has(word) { return this._dict.has(word); }
  get(word) { return this._dict.get(word); }
  getUni(uni) { return this._uni.get(uni); }
  getBi(bi, dist) { return this._bi.get(bi + dist); }
  randomWord() { return pick(this._words); }
  randomTranslation(word) { return this._dict.randomValue(word); }
  randomUni(uni) { return this._uni.randomValue(uni); }
  randomBi(bi, dist) { return this._bi.randomValue(bi + dist); }
}

class DictionaryFormView {
  // Same input as Dictionary constructor, but unstated up there is that some
  // English words can have a form in parens. We're not interested in entries
  // with no form.
  constructor(raw) {
    const d = new Map();
    for (const entry of raw) {
      const [eraw, jraw] = entry;
      const eng = toArray(eraw);
      const jap = toArray(jraw)
                      .map(toHiragana)
                      .map((w) => cleanHiraganaAnswer(w, 1))
                      .filter((w) => w != null);

      // Discard any entries with no form, or where the English entries' forms
      // don't match.
      let form = null;
      for (const word of eng) {
        if (word == null) continue;
        const m = word.match(/.*\(([^)]*)\)/);
        const f = m ? m[1] : null;
        if (f == null) {
          form = null;
          break;
        } else if (form == null) {
          form = f;
        } else if (form != f) {
          form = null;
          break;
        }
      }
      if (form == null) continue;

      const cleanEng = eng.map((w) => cleanEnglishAnswer(w, 1).toLowerCase())
                           .filter((w) => w != null)
                           .sort();
      const key = cleanEng.join('|');
      const gridEntry =
          getOrInsert(d, key, () => new Map([['english', new Set(cleanEng)]]));
      const formEntry = getOrInsert(gridEntry, form, () => new Set());
      for (const j of jap) formEntry.add(j);
    }
    // Array<Map<Str form, Set<Str cleanWord, ...>>>
    this._entries = Array.from(d.values());
  }

  // Map<Str form, Set<Str cleanWord, ...>>
  randomEntry() { return pick(this._entries); }
}

class MetaDictionary {
  // metaraw is an array of [name, raw] pairs, where each raw is an array with
  // the format that the Dictionary constructor expects.
  constructor(metaraw) {
    this._raw = metaraw;
    this._all = this.select(name => true);
  }

  all() { return this._all; }
  select(byName) {
    return new Dictionary(
        this._raw.filter(d => byName(d[0])).flatMap(d => d[1]));
  }
}

class Gram {
  constructor(word, index) {
    this.word = word;
    this.index = index;
  }
}

function _gridKey(x, y) {
  console.assert(x >= -32768 && x <= 32767);
  console.assert(y >= -32768 && y <= 32767);
  return (x & 0xFFFF) | ((y & 0xFFFF) << 16);
}

class Grid {
  constructor(cells = null, xlo = 0, xhi = 0, ylo = 0, yhi = 0) {
    this._cells = cells || new Map();
    this._xlo = xlo;
    this._xhi = xhi;
    this._ylo = ylo;
    this._yhi = yhi;
  }

  clone() {
    return new Grid(
        new Map(this._cells), this._xlo, this._xhi, this._ylo, this._yhi);
  }

  set(x, y, value) {
    this._cells.set(_gridKey(x, y), value);
    this._xlo = Math.min(this._xlo, x);
    this._xhi = Math.max(this._xhi, x);
    this._ylo = Math.min(this._ylo, y);
    this._yhi = Math.max(this._yhi, y);
  }

  get(x, y) { return this._cells.get(_gridKey(x, y)); }
  cols() { return this._xhi - this._xlo + 1; }
  rows() { return this._yhi - this._ylo + 1; }
  colOffset() { return this._xlo; }
  rowOffset() { return this._ylo; }

  inside(x, y) {
    return x >= this._xlo && x <= this._xhi && y >= this._ylo && y <= this._yhi;
  }

  forEach(fn) {
    for (let x = this._xlo; x <= this._xhi; x++) {
      for (let y = this._ylo; y <= this._yhi; y++) {
        fn(this.get(x, y), x, y);
      }
    }
  }

  map(fn) {
    const a = [];
    for (var x = this._xlo; x <= this._xhi; x++) {
      const col = [];
      for (var y = this._ylo; y <= this._yhi; y++) {
        col.push(fn(this.get(x, y), x, y));
      }
      a.push(col);
    }
    return a;
  }

  encode(cellEncoder, cellDelimiter) {
    let a = [];
    this.forEach((c) => a.push(cellEncoder(c)));
    return [this.rows(), this.cols(), a.join(cellDelimiter)].join('\n');
  }

  static decode(s, cellDecoder, cellDelimiter) {
    const [rs, cs, as] = s.split('\n');
    const a = as.split(cellDelimiter);
    const grid = new Grid(null, 0, parseInt(cs) - 1, 0, parseInt(rs) - 1);
    let k = 0;
    grid.forEach((_, x, y) => grid.set(x, y, cellDecoder(a[k++])));
    return grid;
  }
}

class FlippedGrid {
  constructor(grid) { this._grid = grid; }
  set(x, y, value) { this._grid.set(y, x, value); }
  get(x, y) { return this._grid.get(y, x); }
  inside(x, y) { return this._grid.inside(y, x); }
  forEach(fn) { this._grid.forEach((value, x, y) => fn(value, y, x)); }
  cols() { return this._grid.rows(); }
  rows() { return this._grid.cols(); }
  colOffset() { return this._grid.rowOffset(); }
  rowOffset() { return this._grid.colOffset(); }

  map(fn) {
    return flip2DArray(this._grid.map((value, x, y) => fn(value, y, x)));
  }
}

function toArray(singleOrArray) {
  return Array.isArray(singleOrArray) ? singleOrArray : [singleOrArray];
}

function flip2DArray(array) {
  const a = [];
  if (array.length > 0) {
    for (var y = 0; y < array[0].length; ++y) {
      const row = [];
      for (var x = 0; x < array.length; ++x) {
        row.push(array[x][y]);
      }
      a.push(row);
    }
  }
  return a;
}

function shuffle(array) {
  for (let i = 0; i < array.length; ++i) {
    const j = randInt(array.length - i) + i;
    const t = array[i];
    array[i] = array[j];
    array[j] = t;
  }
}

function parseCsv(str) {
  str = str.trim();
  const csv = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    csv.push(row);
    row = [];
  };
  for (const c of str) {
    if (inQuotes) {
      if (c == '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else {
      if (c == '"') {
        inQuotes = true;
      } else if (c == ',') {
        endCell();
      } else if (c == '\n') {
        endRow();
      } else {
        cell += c;
      }
    }
  }
  endRow();
  return csv;
}

// [[[Str englishWord, ...], [Str romanjiWord, ...]]]
// Array<Tuple<Array<Str englishWord>, Array<Str romanjiWord>>>
function parseWordCsv(str) {
  return parseCsv(str).map(row => {
    const e = [];
    const h = [];
    let a = e;
    for (const cell of row) {
      if (cell.length == 0) {
        a = h;
      } else {
        a.push(cell);
      }
    }
    return [e, h];
  });
}

// [[[Str englishWordWithForm, ...], Str romanjiWord], ...]
// Array<Tuple<Array<Str englishWordWithForm>, Str romanjiWord>>
function parseComboCsv(str) {
  const csv = parseCsv(str);
  const names = csv[0];
  const sufs = csv[1];
  const sj = sufs.findIndex(w => w.length > 0);
  const sub = sufs[sj];
  const out = [];
  for (let i = 2; i < csv.length; i++) {
    const row = csv[i];  // [Str cell, ...]
    const e = [];  // [Str englishWord, ...]
    console.assert(row[sj].endsWith(sub));
    const root = row[sj].slice(0, -sub.length);
    for (let j = 0; j < row.length; j++) {
      let w = row[j];
      if (j < sj) {
        if (w.length > 0) e.push(w);
      } else {
        if (w.length == 0) w = root + sufs[j];
        out.push([e.map(u => `${u} (${names[j]})`), w]);
      }
    }
  }
  return out;
}

function toHiragana(romanji) { return toKana(romanji, 0); }
function toKatakana(romanji) { return toKana(romanji, 1); }

function toKana(romanji, kind) {
  // Convert romaji to hiragana
  let hiragana = '';
  hira_outer: for (let i = 0; i < romanji.length;) {
    // Try to find the longest matching romanji to hiragana mapping.
    for (let j = 3; j > 0; j--) {
      if (i + j > romanji.length) continue;
      const h = kRomanji.get(romanji.slice(i, i + j));
      if (h) {
        hiragana += h[kind];
        i += j;
        continue hira_outer;
      }
    }

    // If there's no match, it might be a doubled consonant. In that case the
    // hiragana is a small tsu.
    if (i + 1 < romanji.length && romanji[i] === romanji[i + 1]) {
      hiragana += 'っ';
      i += 1;
      continue hira_outer;
    }

    // Otherwise it might be a character from a small whitelist of punctuation.
    if (romanji[i] == ' ') {
      // Ignore.
      i += 1;
      continue hira_outer;
    } else if (romanji[i] == '~') {
      hiragana += romanji[i];
      i += 1;
      continue hira_outer;
    }

    // If there's still no match, it's a malformed romanji.
    console.error(`Malformed romanji at ${i}: ${romanji}`);
    return null;
  }
  return hiragana;
}

function cleanEnglishAnswer(word, minLength = 2) {
  // Remove anything in parentheses. TODO: Should we also remove special chars
  // like ' ' and "'"?
  let cleaned = '';
  let inParens = false;
  for (const c of word) {
    if (inParens) {
      if (c === ')') {
        inParens = false;
      }
    } else {
      if (c === '(') {
        inParens = true;
      } else {
        cleaned += c;
      }
    }
  }
  const out = cleaned.trim().toUpperCase();
  return out.length < minLength ? null : out;
}

function cleanHiraganaAnswer(word, minLength = 2) {
  const out = word.trim();
  return out.length < minLength ? null : out;
}

function buildHiraganaKeyboard(keyboard, onKey) {
  const kDakuten = '‶';
  const kHandakuten = '°';
  const kHira = [
    ['あ', 'い', 'う', 'え', 'お'],
    ['か', 'き', 'く', 'け', 'こ'],
    ['さ', 'し', 'す', 'せ', 'そ'],
    ['た', 'ち', 'つ', 'て', 'と'],
    ['な', 'に', 'ぬ', 'ね', 'の'],
    ['は', 'ひ', 'ふ', 'へ', 'ほ'],
    ['ま', 'み', 'む', 'め', 'も'],
    ['や', '', 'ゆ', '', 'よ'],
    ['ら', 'り', 'る', 'れ', 'ろ'],
    ['わ', '', '', '', 'を'],
    ['ゃ', 'ゅ', 'ょ', 'っ', 'ん'],
    ['', kDakuten, '', kHandakuten, ''],
  ];

  const kDakMod = [
    null,
    ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
    ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
    ['だ', 'ぢ', 'づ', 'で', 'ど'],
    null,
    ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  ];
  const kHanMod = [
    null,
    null,
    null,
    null,
    null,
    ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
  ];

  const dakuBtn = [];

  keyboard.addEventListener('mousedown', e => e.preventDefault());

  const table = document.createElement('table');

  function applyDakuMod(mod) {
    for (let r = 0; r < kHira.length - 1; ++r) {
      const silenced = mod[r] == null;
      const hr = mod[r] ?? kHira[r];
      for (let c = 0; c < hr.length; c++) {
        const td = table.childNodes[r].childNodes[c];
        td.textContent = hr[c];
        td.classList.toggle('silenced', silenced);
      }
    }
  }

  function onDakuten(e) {
    e.preventDefault();
    const td = e.target;
    const h = td.textContent;
    console.assert(h == kDakuten || h == kHandakuten);
    const on = td.classList.toggle('enabled');
    let mod = kHira;
    if (on) {
      for (const b of dakuBtn) {
        if (b != td) b.classList.remove('enabled');
      }
      mod = h == kDakuten ? kDakMod : kHanMod;
    }
    applyDakuMod(mod);
  }

  function onKeyDown(e) {
    e.preventDefault();
    const h = e.target.textContent;
    onKey(h);

    for (const b of dakuBtn) b.classList.remove('enabled');
    applyDakuMod(kHira);
  }

  for (let r = 0; r < kHira.length; ++r) {
    const hr = kHira[r];
    const tr = document.createElement('tr');
    for (let c = 0; c < hr.length; c++) {
      const h = hr[c];
      const td = document.createElement('td');
      td.textContent = h;
      if (h == kDakuten || h == kHandakuten) {
        dakuBtn.push(td);
        td.classList.add('dakuten');
        td.addEventListener('mousedown', onDakuten);
      } else if (h.length > 0) {
        td.addEventListener('mousedown', onKeyDown);
      } else {
        td.classList.add('empty');
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  keyboard.appendChild(table);
}

const kRomanji = new Map([
  ['a', ['あ', 'ア']],       ['ba', ['ば', 'バ']],
  ['be', ['べ', 'ベ']],      ['bi', ['び', 'ビ']],
  ['bo', ['ぼ', 'ボ']],      ['bu', ['ぶ', 'ブ']],
  ['bya', ['びゃ', 'ビャ']], ['byo', ['びょ', 'ビョ']],
  ['byu', ['びゅ', 'ビュ']], ['cha', ['ちゃ', 'チャ']],
  ['chi', ['ち', 'チ']],     ['cho', ['ちょ', 'チョ']],
  ['chu', ['ちゅ', 'チュ']], ['da', ['だ', 'ダ']],
  ['de', ['で', 'デ']],      ['di', ['ぢ', 'ヂ']],
  ['do', ['ど', 'ド']],      ['du', ['づ', 'ヅ']],
  ['dya', ['ぢゃ', 'ヂャ']], ['dyo', ['ぢょ', 'ヂョ']],
  ['dyu', ['ぢゅ', 'ヂュ']], ['e', ['え', 'エ']],
  ['fu', ['ふ', 'フ']],      ['ga', ['が', 'ガ']],
  ['ge', ['げ', 'ゲ']],      ['gi', ['ぎ', 'ギ']],
  ['go', ['ご', 'ゴ']],      ['gu', ['ぐ', 'グ']],
  ['gya', ['ぎゃ', 'ギャ']], ['gyo', ['ぎょ', 'ギョ']],
  ['gyu', ['ぎゅ', 'ギュ']], ['ha', ['は', 'ハ']],
  ['he', ['へ', 'ヘ']],      ['hi', ['ひ', 'ヒ']],
  ['ho', ['ほ', 'ホ']],      ['hya', ['ひゃ', 'ヒャ']],
  ['hyo', ['ひょ', 'ヒョ']], ['hyu', ['ひゅ', 'ヒュ']],
  ['i', ['い', 'イ']],       ['ja', ['じゃ', 'ジャ']],
  ['ji', ['じ', 'ジ']],      ['jo', ['じょ', 'ジョ']],
  ['ju', ['じゅ', 'ジュ']],  ['ka', ['か', 'カ']],
  ['ke', ['け', 'ケ']],      ['ki', ['き', 'キ']],
  ['ko', ['こ', 'コ']],      ['ku', ['く', 'ク']],
  ['kya', ['きゃ', 'キャ']], ['kyo', ['きょ', 'キョ']],
  ['kyu', ['きゅ', 'キュ']], ['ma', ['ま', 'マ']],
  ['me', ['め', 'メ']],      ['mi', ['み', 'ミ']],
  ['mo', ['も', 'モ']],      ['mu', ['む', 'ム']],
  ['mya', ['みゃ', 'ミャ']], ['myo', ['みょ', 'ミョ']],
  ['myu', ['みゅ', 'ミュ']], ['n', ['ん', 'ン']],
  ['N', ['ん', 'ン']],       ['na', ['な', 'ナ']],
  ['ne', ['ね', 'ネ']],      ['ni', ['に', 'ニ']],
  ['no', ['の', 'ノ']],      ['nu', ['ぬ', 'ヌ']],
  ['nya', ['にゃ', 'ニャ']], ['nyo', ['にょ', 'ニョ']],
  ['nyu', ['にゅ', 'ニュ']], ['o', ['お', 'オ']],
  ['pa', ['ぱ', 'パ']],      ['pe', ['ぺ', 'ペ']],
  ['pi', ['ぴ', 'ピ']],      ['po', ['ぽ', 'ポ']],
  ['pu', ['ぷ', 'プ']],      ['pya', ['ぴゃ', 'ピャ']],
  ['pyo', ['ぴょ', 'ピョ']], ['pyu', ['ぴゅ', 'ピュ']],
  ['ra', ['ら', 'ラ']],      ['re', ['れ', 'レ']],
  ['ri', ['り', 'リ']],      ['ro', ['ろ', 'ロ']],
  ['ru', ['る', 'ル']],      ['rya', ['りゃ', 'リャ']],
  ['ryo', ['りょ', 'リョ']], ['ryu', ['りゅ', 'リュ']],
  ['sa', ['さ', 'サ']],      ['se', ['せ', 'セ']],
  ['sha', ['しゃ', 'シャ']], ['shi', ['し', 'シ']],
  ['sho', ['しょ', 'ショ']], ['shu', ['しゅ', 'シュ']],
  ['so', ['そ', 'ソ']],      ['su', ['す', 'ス']],
  ['ta', ['た', 'タ']],      ['te', ['て', 'テ']],
  ['to', ['と', 'ト']],      ['tsu', ['つ', 'ツ']],
  ['u', ['う', 'ウ']],       ['wa', ['わ', 'ワ']],
  ['wo', ['を', 'ヲ']],      ['ya', ['や', 'ヤ']],
  ['yo', ['よ', 'ヨ']],      ['yu', ['ゆ', 'ユ']],
  ['za', ['ざ', 'ザ']],      ['ze', ['ぜ', 'ゼ']],
  ['zo', ['ぞ', 'ゾ']],      ['zu', ['ず', 'ズ']],
]);

function test() {
  // Test toHiragana
  console.assert(toHiragana('konnichiwa') === 'こんにちわ');
  console.assert(toHiragana('sayonara') === 'さよなら');
  console.assert(toHiragana('arigatou') === 'ありがとう');
  console.assert(toHiragana('kawaii') === 'かわいい');
  console.assert(toHiragana('shashin') === 'しゃしん');
  console.assert(toHiragana('ryuugakusei') === 'りゅうがくせい');
  console.assert(toHiragana('kyou') === 'きょう');
  console.assert(toHiragana('kanojo') === 'かのじょ');
  console.assert(toHiragana('tabemono') === 'たべもの');
  console.assert(toHiragana('inu') === 'いぬ');
  console.assert(toHiragana('neko') === 'ねこ');
  console.assert(toHiragana('kitte') === 'きって');
  console.assert(toHiragana('zasshi') === 'ざっし');

  // Test toArray
  console.assert(JSON.stringify(toArray('a')) === JSON.stringify(['a']));
  console.assert(JSON.stringify(toArray(['a'])) === JSON.stringify(['a']));

  // Test flip2DArray
  console.assert(
      JSON.stringify(flip2DArray([[1, 2], [3, 4]])) ===
      JSON.stringify([[1, 3], [2, 4]]));

  // Test MultiMapBuilder/MultiMap
  const builder = new MultiMapBuilder();
  builder.add('a', 1);
  builder.add('a', 2);
  builder.add('b', 3);
  builder.addAll('b', [4, 5]);
  builder.add('b', 4);
  const multiMap = builder.build();

  // multiMap should have keys 'a' and 'b'
  console.assert(multiMap.has('a'));
  console.assert(multiMap.has('b'));

  console.assert(JSON.stringify(multiMap.get('a')) === JSON.stringify([1, 2]));
  console.assert(
      JSON.stringify(multiMap.get('b')) === JSON.stringify([3, 4, 5]));

  console.assert(['a', 'b'].includes(multiMap.randomKey()));

  console.assert(multiMap.get('a').includes(multiMap.randomValue('a')));
  console.assert(multiMap.get('b').includes(multiMap.randomValue('b')));

  console.assert(JSON.stringify(parseCsv(`
a,b,c
1,2,3,
4,"5,6",7`)) === JSON.stringify([
    ['a', 'b', 'c'],
    ['1', '2', '3', ''],
    ['4', '5,6', '7'],
  ]));

  console.assert(JSON.stringify(parseWordCsv(`
on,,,ue,
husband (mine),,,otto,shujin
little bit,dislike,,chotto
in front,,,mae,`)) === JSON.stringify([
    [['on'], ['ue']],
    [['husband (mine)'], ['otto', 'shujin']],
    [['little bit', 'dislike'], ['chotto']],
    [['in front'], ['mae']],
  ]));

  console.assert(JSON.stringify(parseComboCsv(`
,,,modifying noun,present positive,present negative,past positive,past negative
,,,i,idesu,kunaidesu,kattadesu,kunakattadesu
big,,,ookii,,,,
expensive,tall,,takai,,,,
good,nice,,ii,,yokunaidesu,yokattadesu,yokunakattadesu`)) === JSON.stringify([
    [['big (modifying noun)'], 'ookii'],
    [['big (present positive)'], 'ookiidesu'],
    [['big (present negative)'], 'ookikunaidesu'],
    [['big (past positive)'], 'ookikattadesu'],
    [['big (past negative)'], 'ookikunakattadesu'],
    [['expensive (modifying noun)', 'tall (modifying noun)'], 'takai'],
    [['expensive (present positive)', 'tall (present positive)'], 'takaidesu'],
    [
      ['expensive (present negative)', 'tall (present negative)'],
      'takakunaidesu'
    ],
    [['expensive (past positive)', 'tall (past positive)'], 'takakattadesu'],
    [
      ['expensive (past negative)', 'tall (past negative)'], 'takakunakattadesu'
    ],
    [['good (modifying noun)', 'nice (modifying noun)'], 'ii'],
    [['good (present positive)', 'nice (present positive)'], 'iidesu'],
    [['good (present negative)', 'nice (present negative)'], 'yokunaidesu'],
    [['good (past positive)', 'nice (past positive)'], 'yokattadesu'],
    [['good (past negative)', 'nice (past negative)'], 'yokunakattadesu']
  ]));

  console.assert(cleanEnglishAnswer('  sdlkfg (dlsfg, sdfg) (???)') === 'SDLKFG');
  console.assert(cleanHiraganaAnswer('  alskdfg  ') === 'alskdfg');
}

test();
