class MultiMapBuilder {
  constructor() { this._map = new Map(); }

  _poke(key) {
    if (!this._map.has(key)) this._map.set(key, new Set());
    return this._map.get(key);
  }

  add(key, value) {
    if (key != null) this._poke(key).add(value);
  }

  addAll(key, values) {
    if (key == null) return;
    const entry = this._poke(key);
    for (const value of values) entry.add(value);
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

  randomKey() {
    return this._keys[Math.floor(Math.random() * this._keys.length)];
  }

  randomValue(k) {
    const values = this._map.get(k);
    return values ? values[Math.floor(Math.random() * values.length)] : null;
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
  }

  // Returns a set of English translations for a given Japanese word.
  japToEng(word) { return this._jap.get(word); }

  // Returns a set of Japanese translations for a given English word.
  engToJap(word) { return this._eng.get(word); }

  japView() { return this._jap; }
  engView() { return this._eng; }
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

  randomWord() {
    return this._words[Math.floor(Math.random() * this._words.length)];
  }

  randomTranslation(word) { return this._dict.randomValue(word); }
  randomUni(uni) { return this._uni.randomValue(uni); }
  randomBi(bi, dist) { return this._bi.randomValue(bi + dist); }
}

class MetaDictionary {
  // metaraw is an array of [name, raw] pairs, where each raw has the format
  // that the Dictionary constructor expects.
  constructor(metaraw) {
    // TODO: Implement dictionary selection and merging mechanism.
    this._dicts = new Map(metaraw.map(d => [d[0], new Dictionary(d[1])]));
    this._all = new Dictionary(metaraw.flatMap(d => d[1]));
  }

  all() { return this._all; }
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

function parseComboCsv(str) {
  const csv = parseCsv(str);
  const names = csv[0];
  const sufs = csv[1];
  const sj = sufs.findIndex(w => w.length > 0);
  const sub = sufs[sj];
  const out = [];
  for (let i = 2; i < csv.length; i++) {
    const row = csv[i];
    const e = [];
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

function toHiragana(romanji) {
  // Convert romaji to hiragana
  let hiragana = '';
  hira_outer: for (let i = 0; i < romanji.length;) {
    // Try to find the longest matching romanji to hiragana mapping.
    for (let j = 3; j > 0; j--) {
      if (i + j > romanji.length) continue;
      const h = kRomanji.get(romanji.slice(i, i + j));
      if (h) {
        hiragana += h;
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

function cleanEnglishAnswer(word) {
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
  return out.length < 2 ? null : out;
}

function cleanHiraganaAnswer(word) {
  const out = word.trim();
  return out.length < 2 ? null : out;
}

const kRomanji = new Map([
  ['a', 'あ'],     ['ba', 'ば'],    ['be', 'べ'],    ['bi', 'び'],
  ['bo', 'ぼ'],    ['bu', 'ぶ'],    ['bya', 'びゃ'], ['byo', 'びょ'],
  ['byu', 'びゅ'], ['cha', 'ちゃ'], ['chi', 'ち'],   ['cho', 'ちょ'],
  ['chu', 'ちゅ'], ['da', 'だ'],    ['de', 'で'],    ['di', 'ぢ'],
  ['do', 'ど'],    ['du', 'づ'],    ['dya', 'ぢゃ'], ['dyo', 'ぢょ'],
  ['dyu', 'ぢゅ'], ['e', 'え'],     ['fu', 'ふ'],    ['ga', 'が'],
  ['ge', 'げ'],    ['gi', 'ぎ'],    ['go', 'ご'],    ['gu', 'ぐ'],
  ['gya', 'ぎゃ'], ['gyo', 'ぎょ'], ['gyu', 'ぎゅ'], ['ha', 'は'],
  ['he', 'へ'],    ['hi', 'ひ'],    ['ho', 'ほ'],    ['hya', 'ひゃ'],
  ['hyo', 'ひょ'], ['hyu', 'ひゅ'], ['i', 'い'],     ['ja', 'じゃ'],
  ['ji', 'じ'],    ['jo', 'じょ'],  ['ju', 'じゅ'],  ['ka', 'か'],
  ['ke', 'け'],    ['ki', 'き'],    ['ko', 'こ'],    ['ku', 'く'],
  ['kya', 'きゃ'], ['kyo', 'きょ'], ['kyu', 'きゅ'], ['ma', 'ま'],
  ['me', 'め'],    ['mi', 'み'],    ['mo', 'も'],    ['mu', 'む'],
  ['mya', 'みゃ'], ['myo', 'みょ'], ['myu', 'みゅ'], ['n', 'ん'],
  ['na', 'な'],    ['ne', 'ね'],    ['ni', 'に'],    ['no', 'の'],
  ['nu', 'ぬ'],    ['nya', 'にゃ'], ['nyo', 'にょ'], ['nyu', 'にゅ'],
  ['o', 'お'],     ['pa', 'ぱ'],    ['pe', 'ぺ'],    ['pi', 'ぴ'],
  ['po', 'ぽ'],    ['pu', 'ぷ'],    ['pya', 'ぴゃ'], ['pyo', 'ぴょ'],
  ['pyu', 'ぴゅ'], ['ra', 'ら'],    ['re', 'れ'],    ['ri', 'り'],
  ['ro', 'ろ'],    ['ru', 'る'],    ['rya', 'りゃ'], ['ryo', 'りょ'],
  ['ryu', 'りゅ'], ['sa', 'さ'],    ['se', 'せ'],    ['sha', 'しゃ'],
  ['shi', 'し'],   ['sho', 'しょ'], ['shu', 'しゅ'], ['so', 'そ'],
  ['su', 'す'],    ['ta', 'た'],    ['te', 'て'],    ['to', 'と'],
  ['tsu', 'つ'],   ['u', 'う'],     ['wa', 'わ'],    ['wo', 'を'],
  ['ya', 'や'],    ['yo', 'よ'],    ['yu', 'ゆ'],    ['za', 'ざ'],
  ['ze', 'ぜ'],    ['zo', 'ぞ'],    ['zu', 'ず'],
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
