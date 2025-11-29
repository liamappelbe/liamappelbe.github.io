function normalize(text) {
  const out = (text || '').toUpperCase().slice(0, 1);
  return out == ' ' ? '' : out;
}

class UiCell {
  constructor(container, node) {
    this.container = container;
    this.node = node;
    this.isComposing = false;
    this.clues = [];
  }

  focus() { this.node.focus(); }
  setValue(value) { this.node.value = normalize(value); }
  getValue() { return normalize(this.node.value); }
  clear() { this.node.value = ''; }
  isEmpty() { return this.node.value === ''; }

  highlight(active) {
    if (active) {
      this.container.classList.add('highlight');
    } else {
      this.container.classList.remove('highlight');
    }
  }

  lowHighlight(active) {
    if (active) {
      this.container.classList.add('low-highlight');
    } else {
      this.container.classList.remove('low-highlight');
    }
  }
}

class UiClue {
  constructor(node) {
    this.node = node;
    this._hover = false;
    this._cellFocus = false;
  }

  highlight(active) { this.node.classList.toggle('highlight', active); }

  lowHighlightDueToHover(active) {
    this._hover = active;
    this._updateLowHighlight();
  }

  lowHighlightDueToCellFocus(active) {
    this._cellFocus = active;
    this._updateLowHighlight();
  }

  _updateLowHighlight() {
    this.node.classList.toggle('low-highlight', this._hover || this._cellFocus);
  }

  errorHilight(active) {
    this.node.classList.toggle('error-highlight', active);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  function newEnglishCrossword() {
    renderCrossword(kModeEng, generateCrossword(kModeEng), null);
  }

  function newHiraganaCrossword() {
    renderCrossword(kModeHir, generateCrossword(kModeHir), null);
  }

  function renderCrossword(mode, crossword, prefilledCells) {
    prefilledCells ??= new Grid();

    document.getElementById('hiragana-keyboard')
        .classList.toggle('hidden', mode != kModeHir);

    const onUpdate = () => {
      const cellValues = new Grid();
      uiCells.forEach((uiCell, r, c) => {
        if (uiCell != null) cellValues.set(r, c, uiCell.getValue());
      });
      saveCrossword(mode, crossword, cellValues);
      checkSolved();
    };

    const rows = crossword.rows();
    const cols = crossword.cols();
    const container = document.getElementById('crossword-container');
    container.innerHTML = '';

    // Create a message area for win notification
    const winMsg = document.getElementById('win-message');
    winMsg.textContent = '';

    const table = document.createElement('table');
    table.className = 'crossword-grid';

    const uiCells = new Grid();  // A Grid of UiCells.
    const uiClues = new Map();  // A Map from Clue objects to UiClues.

    let focusedClue = null;
    let hoveredClue = null;
    let focusedCell = null;

    const clueContains = (clue, r, c) => clue?.contains(r, c) ?? false;

    const cellHighlights = new Set();
    const cellLowHighlights = new Set();
    const updateCellHighlightsDueToClues = () => {
      cellHighlights.forEach(c => c.highlight(false));
      cellHighlights.clear();
      cellLowHighlights.forEach(c => c.lowHighlight(false));
      cellLowHighlights.clear();
      focusedClue?.forEachCell((r, c) => {
        const cell = uiCells.get(r, c);
        cell.highlight(true);
        cellHighlights.add(cell);
      });
      hoveredClue?.forEachCell((r, c) => {
        const cell = uiCells.get(r, c);
        cell.lowHighlight(true);
        cellLowHighlights.add(cell);
      });
    };

    const focusClue =
        (clue) => {
          uiClues.get(focusedClue)?.highlight(false);
          uiClues.get(clue)?.highlight(true);
          focusedClue = clue;
          updateCellHighlightsDueToClues();
          if (clue == null) return;
          uiCells.get(clue.row(), clue.col()).focus();
        }

    const hoverClue =
        (clue) => {
          uiClues.get(hoveredClue)?.lowHighlightDueToHover(false);
          uiClues.get(clue)?.lowHighlightDueToHover(true);
          hoveredClue = clue;
          updateCellHighlightsDueToClues();
        }

    let pr = null;
    let pc = null;
    let fr = null;
    let fc = null;
    const onCellFocus =
        (r, c, uiCell) => {
          pr = fr;
          pc = fc;
          fr = r;
          fc = c;
          focusedCell?.clues.forEach(c => c.lowHighlightDueToCellFocus(false));
          uiCell?.clues.forEach(c => c.lowHighlightDueToCellFocus(true));
          focusedCell = uiCell;
          if (!clueContains(focusedClue, r, c)) {
            focusClue(null);
          }
        }

    const focusCell =
        (r, c) => {
          uiCells.get(r, c)?.focus();
        }

    const focusNextCell = (r, c) => {
      const canRight = uiCells.get(r, c + 1) != null;
      const canDown = uiCells.get(r + 1, c) != null;
      if (focusedClue != null) {
        if (focusedClue.isDown()) {
          if (canDown) {
            focusCell(r + 1, c);
            return;
          }
        } else {
          if (canRight) {
            focusCell(r, c + 1);
            return;
          }
        }
      }
      if (pr === r && pc === c - 1 && canRight) {
        focusCell(r, c + 1);
      } else if (pr === r - 1 && pc === c && canDown) {
        focusCell(r + 1, c);
      } else if (canRight) {
        focusCell(r, c + 1);
      } else if (canDown) {
        focusCell(r + 1, c);
      }
    };

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const cell = crossword.cell(r, c);
        const td = document.createElement('td');
        td.className = 'crossword-cell';

        if (cell != kInvalidCell) {
          // Empty input for user to fill in. We use a normal text input
          // but intercept key events so typing any single character
          // immediately overwrites the cell's value (no need to delete first).
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.className = 'crossword-input';
          if (mode != kModeEng) input.inputMode = 'kana';
          input.autocomplete = 'off';
          input.spellcheck = false;
          td.appendChild(input);
          console.log(input);

          const uiCell = new UiCell(td, input);
          uiCell.setValue(prefilledCells.get(r, c));
          uiCells.set(r, c, uiCell);

          // When focused, select the contents so a single keystroke replaces it
          input.addEventListener('focus', () => {
            try {
              input.select();
            } catch (err) { /* defensive */
            }
            onCellFocus(r, c, uiCell);
          });

          // Track IME composition so we don't interfere with multi-key input
          uiCell.isComposing = false;
          input.addEventListener('compositionstart', () => {
            uiCell.isComposing = true;
          });
          input.addEventListener('compositionend', () => {
            uiCell.isComposing = false;
          });

          // Handle direct key presses: replace with the pressed character when
          // it's a printable key. We avoid hardcoding A-Z so unicode letters
          // (hiragana, katakana, kanji) and space are accepted. For IME
          // composition we let the browser handle input and normalize in the
          // 'input' handler.
          input.addEventListener('keydown', (e) => {
            // Allow modifier combos to pass through
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const key = e.key;

            // If IME composition is active, don't intercept keydown
            if (uiCell.isComposing) return;

            // Treat any single-character key as printable (covers unicode
            // letters and space)
            if (key && key.length === 1) {
              e.preventDefault();
              uiCell.setValue(key);
              focusNextCell(r, c);
              onUpdate();
              return;
            }

            if (key === 'Backspace' || key === 'Delete') {
              e.preventDefault();
              uiCell.clear();
              onUpdate();
              return;
            }

            // Simple arrow navigation between cells
            if (key === 'ArrowRight') {
              e.preventDefault();
              focusCell(r, c + 1);
              return;
            }
            if (key === 'ArrowLeft') {
              e.preventDefault();
              focusCell(r, c - 1);
              return;
            }
            if (key === 'ArrowDown') {
              e.preventDefault();
              focusCell(r + 1, c);
              return;
            }
            if (key === 'ArrowUp') {
              e.preventDefault();
              focusCell(r - 1, c);
              return;
            }
          });

          // Handle paste: take first character only
          input.addEventListener('paste', (e) => {
            e.preventDefault();
            const text =
                (e.clipboardData || window.clipboardData).getData('text') || '';
            if (text.length > 0) {
              uiCell.setValue(text);
              focusNextCell(r, c);
              onUpdate();
            }
          });

          // Fallback input handler (e.g., mobile IME) - normalize and truncate
          input.addEventListener('input', () => {
            uiCell.setValue(input.value);
            focusNextCell(r, c);
            onUpdate();
          });
        } else {
          td.classList.add('crossword-block');
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    container.appendChild(table);

    // Render clues
    const cluesList = document.getElementById('clues-list');
    cluesList.innerHTML = '';
    for (const clue of crossword.clues()) {
      // Try to get clue text, direction, and index
      const text = clue.text();
      const dir = clue.isDown() ? '↓' : '→';
      const idx = clue.index();
      const r = clue.row();
      const c = clue.col();
      const li = document.createElement('li');
      li.className = 'clue';
      li.textContent = `${idx} ${dir} ${text}`;
      const uiClue = new UiClue(li);
      uiClues.set(clue, uiClue);
      cluesList.appendChild(li);
      uiCells.get(r, c).container.dataset.clueIndex = idx;

      clue.forEachCell((rr, cc) => {
        uiCells.get(rr, cc).clues.push(uiClue);
      });

      // Click handler: focus the clue
      li.addEventListener('click', () => {
        focusClue(clue);
      });

      li.addEventListener('mouseenter', () => {
        hoverClue(clue);
      });
      li.addEventListener('mouseleave', () => {
        hoverClue(null);
      });
    }

    function checkSolved() {
      const errors = getSolvedStatus();
      if (errors == null) {
        winMsg.textContent = '';
      } else if (errors.size == 0) {
        winMsg.textContent = '🎉 You solved the puzzle!';
      } else {
        winMsg.textContent = '❌ There are mistakes';
      }
      hilightErrors(errors ?? new Set());
    }

    // Three possible results:
    //  - Puzzle has unfilled cells that should be filled, return null
    //  - Otherwise, return a list of all the errors, Set<UiClue>
    //      If the puzzle is solved, the error list will be empty
    function getSolvedStatus() {
      const errors = new Set();
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = normalize(crossword.cell(row, col));
          if (cell !== kInvalidCell) {
            const uiCell = uiCells.get(row, col);
            const uiCellValue = uiCell.getValue();
            if (uiCellValue !== cell) {
              if (uiCellValue == '') {
                return null;
              } else {
                for (const clue of uiCell.clues) errors.add(clue);
              }
            }
          }
        }
      }
      return errors;
    }

    function hilightErrors(errors) {
      // Errors is a non-null Set<UiClue>.
      for (const clue of uiClues.values()) clue.errorHilight(errors.has(clue));
    }
  }

  function buildHiraganaKeyboard() {
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

    const keyboard = document.getElementById('hiragana-keyboard');
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

    function sendKeyEvent(type, key) {
      const target = document.activeElement;
      if (target != null && target.classList.contains('crossword-input')) {
        target.dispatchEvent(new KeyboardEvent(
            type, {key: key, bubbles: true, cancelable: true}));
        return target;
      }
      return null;
    }
    function onKeyDown(e) {
      e.preventDefault();
      const h = e.target.textContent;
      const inp = sendKeyEvent('keydown', h);
      if (inp != null) inp.value = h;

      for (const b of dakuBtn) b.classList.remove('enabled');
      applyDakuMod(kHira);
    }
    function onKeyUp(e) { sendKeyEvent('keyup', e.target.textContent); }

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
          td.addEventListener('mouseup', onKeyUp);
        } else {
          td.classList.add('empty');
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    keyboard.appendChild(table);
  }

  const db = new Storage('HiraganaCrossword');

  function tryLoadCrossword() {
    const encoded = db.get('crossword');
    if (encoded == null) return false;
    const [mode, crossword, prefilledCells] = decode(encoded);
    renderCrossword(mode, crossword, prefilledCells);
    return true;
  }

  function saveCrossword(mode, crossword, prefilledCells) {
    db.set('crossword', encode(mode, crossword, prefilledCells));
  }

  function encode(mode, crossword, prefilledCells) {
    const ps = prefilledCells.encode(c => (c || '') == '' ? ' ' : c, '');
    return [mode, crossword.encode(), ps].join('\n\n');
  }

  function decode(s) {
    const [ms, cs, ps] = s.split('\n\n');
    const p = Grid.decode(ps, c => c == ' ' ? null : c, '');
    return [parseInt(ms), Crossword.decode(cs), p];
  }

  buildHiraganaKeyboard();
  if (!tryLoadCrossword()) newHiraganaCrossword();
  document.getElementById('new-eng-btn').onclick = newEnglishCrossword;
  document.getElementById('new-hir-btn').onclick = newHiraganaCrossword;

  // calculateWordDistributions(hirDist, engDist);
});

const hirDist = new Map();
const engDist = new Map();
let distLoops = 0;
