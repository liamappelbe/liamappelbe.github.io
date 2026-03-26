function node(id) { return document.getElementById(id); }
function hide(id) { node(id).classList.add('hidden'); }
function show(id) { node(id).classList.remove('hidden'); }

function validKana([romanji, [hiragana, katakana]]) {
  if (romanji == 'N') return false;
  if (hiragana.length > 1) return false;
  return true;
}

class KanaWriting {
  constructor() {
    this.canvas = node('drawing-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;

    // Get all hiragana characters from kRomanji
    this.kanaList = Array.from(kRomanji.entries()).filter(validKana);
    this.kanaIndex = this.kanaList.length;

    this.setupCanvas();
    this.attachEventListeners();
    this.nextCharacter();
  }

  setupCanvas() {
    // Set canvas size - responsive but at least 300x300
    const containerWidth = this.canvas.parentElement.clientWidth;
    const size = Math.max(300, Math.min(400, containerWidth - 40));
    this.canvas.width = size;
    this.canvas.height = size;

    // Set canvas drawing properties
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#f5f5f5';
    this.ctx.fillStyle = '#212121';

    // Fill background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  attachEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e));
    this.canvas.addEventListener('touchmove', (e) => this.draw(e));
    this.canvas.addEventListener('touchend', () => this.stopDrawing());
    this.canvas.addEventListener('touchcancel', () => this.stopDrawing());

    // Button events
    node('clear-btn').addEventListener('click', () => this.clearCanvas());
    node('reveal-btn').addEventListener('click', () => this.revealAnswer());
    node('next-btn').addEventListener('click', () => this.nextCharacter());

    // Kana selector
    node('kana-selector').addEventListener('change', () => this.kanaSelect());
  }

  getCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      // Mouse event
      return {x: e.clientX - rect.left, y: e.clientY - rect.top};
    }
  }

  startDrawing(e) {
    e.preventDefault();
    this.isDrawing = true;
    const coords = this.getCanvasCoordinates(e);
    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  draw(e) {
    if (!this.isDrawing) return;

    e.preventDefault();
    const coords = this.getCanvasCoordinates(e);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(coords.x, coords.y);
    this.ctx.stroke();

    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  stopDrawing() { this.isDrawing = false; }

  kanaSelect() {
    if (node('kana-selector').value == 'k') {
      hide('answer-value-h');
      show('answer-value-k');
    } else {
      show('answer-value-h');
      hide('answer-value-k');
    }
  }

  clearCanvas() {
    this.ctx.fillStyle = '#212121';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  revealAnswer() { show('answer-section'); }

  nextCharacter() {
    // Clear canvas and hide answer
    this.clearCanvas();
    hide('answer-section');

    // Update display
    ++this.kanaIndex;
    if (this.kanaIndex >= this.kanaList.length) {
      this.kanaIndex = 0;
      shuffle(this.kanaList);
    }
    const kana = this.kanaList[this.kanaIndex];
    node('romanji-value').textContent = kana[0];
    node('answer-value-h').textContent = kana[1][0];
    node('answer-value-k').textContent = kana[1][1];
  }
}

// Initialize the practice when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new KanaWriting();
});
