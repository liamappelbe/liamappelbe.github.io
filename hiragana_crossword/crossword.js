const kInvalidCell = '█';

class Crossword {
  constructor(rows, cols, grid, clues) {
    this._rows = rows;
    this._cols = cols;
    this._grid = grid;
    this._clues = clues;
    console.assert(this._grid.length === this._rows * this._cols);
  }

  rows() { return this._rows; }
  cols() { return this._cols; }
  clues() { return this._clues; }

  cell(row, col) {
    console.assert(row >= 0 && row < this._rows);
    console.assert(col >= 0 && col < this._cols);
    return this._grid[row * this._cols + col];
  }

  pretty() {
    const chunks = [];
    for (let i = 0; i < this._grid.length; i += this._cols) {
      chunks.push(this._grid.slice(i, i + this._cols));
    }
    return chunks.join('\n');
  }
}

class Clue {
  constructor(row, col, index, isDown, length, text) {
    this._row = row;
    this._col = col;
    this._index = index;
    this._isDown = isDown;
    this._length = length;
    this._text = text;
  }

  row() { return this._row; }
  col() { return this._col; }
  index() { return this._index; }
  isDown() { return this._isDown; }
  length() { return this._length; }
  text() { return this._text; }

  contains(row, col) {
    if (this._isDown) {
      return this._col === col && this._row <= row &&
        this._row + this._length > row;
    } else {
      return this._row === row && this._col <= col &&
        this._col + this._length > col;
    }
  }

  forEachCell(fn) {
    const dx = _dx(this._isDown);
    const dy = _dy(this._isDown);
    for (let i = 0; i < this._length; ++i) {
      fn(this._row + i * dy, this._col + i * dx);
    }
  }
}

const kModeHir = 0;
const kModeEng = 1;

function generateCrossword(mode) {
  const md = kMetaDict.all();
  const d = mode == kModeHir ? md.japView() : md.engView();
  const gen = new CrosswordGenerator(10, d);
  while (!gen.step()) {
  }
  return gen.result();
}

const kCandidates = 10;
const kGenerationPhase = 0;
const kRefinementPhase = 1;
class CrosswordGenerator {
  constructor(totalWords, dict) {
    this._totalWords = totalWords;
    this._dict = dict;
    this._words = 0;
    this._candidates = [];
    this._nextCandidates = [];
    this._phase = kGenerationPhase;
    this._result = null;
  }

  // One step of the crossword generation. Returns true if the generation is
  // done, false if more steps are needed.
  step() {
    if (this._phase == kGenerationPhase) {
      if (this._candidates.length == 0) {
        if (this._nextCandidates.length == 0) {
          // No valid candidates. Generation failed (or hasn't begun). Restart.
          this._generateCandidates(kCandidates);
          return false;
        }

        this._candidates = this._best(this._nextCandidates, kCandidates);
        this._nextCandidates = [];
        ++this._words;

        if (this._words >= this._totalWords) {
          this._phase = kRefinementPhase;
        }
        return false;
      }
      console.assert(this._candidates.length > 0);
      this._stepCandidate(this._candidates.pop());
      return false;
    } else {
      if (this._candidates.length == 0) {
        this._finalizeResult(this._nextCandidates);
        return true;
      }
      this._refineCandidate(this._candidates.pop());
      return false;
    }
  }

  // Returns the finisihed crossword, or null if the generation isn't done.
  result() { return this._result; }

  _generateCandidates(count) {
    this._words = 1;
    for (let i = 0; i < count; ++i) {
      // Pick a random word to seed the crossword.
      const word = this._dict.randomWord();
      const cc = new CrosswordBuilder(this._dict);
      cc.fill(0, 0, false, word);
      this._candidates.push(cc);
    }
  }

  _stepCandidate(candidate) {
    // Use the greedy algorithm. If this produces puzzles that bias towards
    // words that are easy to add to a crossword, use the cleverer algorithm.
    this._addAnyWord(candidate);
  }

  _addAnyWord(candidate) {
    var found = false;
    const tryFill = (x, y, vertical, g) => {
      if (!g) return false;
      const wx = x - _dx(vertical, g.index);
      const wy = y - _dy(vertical, g.index);
      if (candidate.canFill(wx, wy, vertical, g.word)) {
        const newCandidate = candidate.clone();
        newCandidate.fill(wx, wy, vertical, g.word);
        if (newCandidate.isValid()) {
          found = true;
          this._nextCandidates.push(newCandidate);
          return true;
        }
      }
      return false;
    };
    candidate.forEachOpenBigram((b, x0, y0, x1, y1, vertical) => {
      for (let attempt = 0; attempt < 10; ++attempt) {
        const g = this._dict.randomBi(b, vertical ? y1 - y0 : x1 - x0);
        if (tryFill(x0, y0, vertical, g)) break;
      }
    });
    if (!found) {
      candidate.forEachOpenUnigram((c, x, y, vertical) => {
        for (let attempt = 0; attempt < 10; ++attempt) {
          const g = this._dict.randomUni(c);
          if (tryFill(x, y, vertical, g)) break;
        }
      });
    }
  }

  _refineCandidate(candidate) {
    // Same as _addAnyWord, but we don't allow the crossword borders to get
    // larger, we only try to add a single word (ie max 1 new candidate), and
    // we move the candidate from _candidates to _nextCandidates only if we
    // *failed* to add a word.
    var found = false;
    const tryFill = (x, y, vertical, g) => {
      if (!g) return false;
      const wx = x - _dx(vertical, g.index);
      const wy = y - _dy(vertical, g.index);
      const ux = wx + _dx(vertical, g.word.length - 1);
      const uy = wy + _dy(vertical, g.word.length - 1);
      if (candidate.inside(wx, wy) && candidate.inside(ux, uy)) {
        if (candidate.canFill(wx, wy, vertical, g.word)) {
          const newCandidate = candidate.clone();
          newCandidate.fill(wx, wy, vertical, g.word);
          if (newCandidate.isValid()) {
            found = true;
            this._candidates.push(newCandidate);
            return true;
          }
        }
      }
      return false;
    };
    candidate.forEachOpenBigram((b, x0, y0, x1, y1, vertical) => {
      if (found) return;
      for (let attempt = 0; attempt < 10; ++attempt) {
        const g = this._dict.randomBi(b, vertical ? y1 - y0 : x1 - x0);
        if (tryFill(x0, y0, vertical, g)) break;
      }
    });
    if (!found) {
      candidate.forEachOpenUnigram((c, x, y, vertical) => {
        if (found) return;
        for (let attempt = 0; attempt < 10; ++attempt) {
          const g = this._dict.randomUni(c);
          if (tryFill(x, y, vertical, g)) break;
        }
      });
    }
    if (!found) {
      this._nextCandidates.push(candidate);
    }
  }

  _best(candidates, count) {
    candidates.forEach(cc => cc.updateQuality());
    candidates.sort((a, b) => b.quality - a.quality);
    return candidates.slice(0, count);
  }

  _finalizeResult(candidates) {
    // Choose the best candidate.
    const best = this._best(candidates, 1)[0];

    // Flip the orientation so that vertical is the longer axis.
    const flipped = best.cols() > best.rows();

    // Convert to Crossword object.
    this._result = best.build(flipped);
  }
}

function _dx(vertical, i = 1) { return vertical ? 0 : i; }
function _dy(vertical, i = 1) { return vertical ? i : 0; }

class CrosswordBuilder {
  constructor(dict, grid = null) {
    this._grid = grid || new Grid();
    this._dict = dict;
    this.quality = null;
  }

  rows() { return this._grid.rows(); }
  cols() { return this._grid.cols(); }
  inside(x, y) { return this._grid.inside(x, y); }
  clone() { return new CrosswordBuilder(this._dict, this._grid.clone()); }

  canFill(x, y, vertical, word) {
    for (var i = 0; i < word.length; ++i) {
      const xx = x + _dx(vertical, i);
      const yy = y + _dy(vertical, i);
      const c = word[i];
      if ((this._grid.get(xx, yy) || c) != c) return false;
    }
    return true;
  }

  fill(x, y, vertical, word) {
    for (var i = 0; i < word.length; ++i) {
      const xx = x + _dx(vertical, i);
      const yy = y + _dy(vertical, i);
      const c = word[i];
      console.assert((this._grid.get(xx, yy) || c) == c);
      this._grid.set(xx, yy, c);
    }
  }

  build(flipped) {
    const g = flipped ? new FlippedGrid(this._grid) : this._grid;
    console.log(this._toString(g));
    const gs = flip2DArray(this._to2DArray(g)).map(r => r.join('')).join('');
    return new Crossword(g.rows(), g.cols(), gs, this._generateClues(g));
  }

  updateQuality() {
    // Heuristics, in order of importance:
    //  - More filled cells is better
    //  - Higher density is better
    //  - More open cells is better
    //  - Squarer dimensions are better
    // Note: The filled cells count is the only value that is not in the range
    // [0, 1]. So its weight multiplier is lower than expected, given its
    // importance. I expect the number of filled cells in a typical puzzle to
    // be around 100. So you can think of kFilledWeight as being roughly 100x
    // larger than the value it has here.
    const kFilledWeight = 1;
    const kDensityWeight = 50;
    const kOpennessWeight = 30;
    const kSquarenessWeight = 3;
    const rows = this._grid.rows();
    const cols = this._grid.cols();
    const cells = rows * cols;
    let filled = 0;
    let open = 0;
    this._grid.forEach((value, x, y) => {
      if (value != null) {
        ++filled;
        if (this.isOpenCell(x, y, false)) ++open;
        if (this.isOpenCell(x, y, true)) ++open;
      }
    });
    const density = filled / cells;  // [0, 1]
    const openness = open / filled;  // [0, 1]
    const squareness = Math.min(rows, cols) / Math.max(rows, cols);  // [0, 1]
    this._quality = filled * kFilledWeight + density * kDensityWeight +
      openness * kOpennessWeight + squareness * kSquarenessWeight;
    // console.log('Quality factors:', filled * kFilledWeight,
    //   density * kDensityWeight, openness * kOpennessWeight,
    //   squareness * kSquarenessWeight, 'total:', this._quality);
  }

  // An open cell in a given direction is one that is filled, but both adjacent
  // cells in that axis are empty.
  isOpenCell(x, y, vertical) {
    return this._isOpenCell(this._grid, x, y, vertical);
  }

  isValid() {
    // - Every word must be in the dictionary.
    // - No duplicate words.
    let ok = true;
    const seen = new Set();
    this.forEachWord((word) => {
      if (!ok) return;
      if (!this._dict.has(word)) ok = false;
      if (seen.has(word)) ok = false;
      seen.add(word);
    })
    return ok;
  }

  forEachWord(fn) { this._forEachWord(this._grid, fn); }

  forEachOpenUnigram(fn) {
    for (const vertical of [true, false]) {
      this._forEachOpenUnigramDir(
        this._grid, vertical, (c, x, y) => fn(c, x, y, vertical));
    }
  }

  forEachOpenBigram(fn) {
    for (const vertical of [true, false]) {
      this._forEachOpenBigramDir(
        this._grid, vertical,
        (b, x0, y0, x1, y1) => fn(b, x0, y0, x1, y1, vertical));
    }
  }

  _getWord(grid, x, y, dx, dy) {
    if (grid.get(x - dx, y - dy) != null) return null;
    if (grid.get(x + dx, y + dy) == null) return null;
    let word = '';
    for (let i = 0; ; ++i) {
      const c = grid.get(x + i * dx, y + i * dy);
      if (c == null) break;
      word += c;
    }
    return word;
  }

  _forEachWord(grid, fn) {
    grid.forEach((value, x, y) => {
      for (const [dx, dy, vertical] of [[1, 0, false], [0, 1, true]]) {
        const word = this._getWord(grid, x, y, dx, dy);
        if (word) fn(word, x, y, vertical);
      }
    });
  }

  _forEachOpenUnigramDir(grid, vertical, fn) {
    grid.forEach((c, x, y) => {
      if (this.isOpenCell(x, y, vertical)) {
        fn(c, x, y);
      }
    });
  }

  _forEachOpenBigramDir(grid, vertical, fn) {
    this._forEachOpenUnigramDir(grid, vertical, (c0, x0, y0) => {
      for (let i = 2; ; ++i) {
        const x1 = x0 + _dx(vertical, i);
        const y1 = y0 + _dy(vertical, i);
        if (!grid.inside(x1, y1)) break;
        const c1 = grid.get(x1, y1);
        if (c1 != null) {
          if (this.isOpenCell(x1, y1, vertical)) {
            fn(c0 + c1, x0, y0, x1, y1);
          }
          break;
        }
      }
    });
  }

  _isOpenCell(grid, x, y, vertical) {
    if (grid.get(x, y) == null) return false;
    const dx = _dx(vertical, 1);
    const dy = _dy(vertical, 1);
    return grid.get(x + dx, y + dy) == null && grid.get(x - dx, y - dy) == null;
  }

  _generateClues(grid) {
    const clues = [];
    const ox = grid.colOffset();
    const oy = grid.rowOffset();
    this._forEachWord(grid, (word, x, y, vertical) => {
      const text = this._dict.randomTranslation(word);
      console.assert(text != null, `No translation for ${word}`);
      clues.push(new Clue(y - oy, x - ox, null, vertical, word.length, text));
    });
    clues.sort((a, b) => a.row() - b.row() || a.col() - b.col());
    console.log(new Array(clues));
    let row = null;
    let col = null;
    let index = 0;
    for (const c of clues) {
      if (row != c.row() || col != c.col()) ++index;
      c._index = index;
      row = c.row();
      col = c.col();
    }
    clues.sort((a, b) => a.index() - b.index() || a.isDown() - b.isDown());
    console.log(new Array(clues));
    return clues;
  }

  _to2DArray(grid) { return grid.map((value) => value || kInvalidCell); }

  _toString(grid) {
    const array = this._to2DArray(grid);
    return flip2DArray(array).map(row => row.join('')).join('\n');
  }

  toString() { return this._toString(this._grid); }
}
