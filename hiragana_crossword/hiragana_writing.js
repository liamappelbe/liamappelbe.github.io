class HiraganaWritingPractice {
  constructor() {
    this.canvas = document.getElementById('drawing-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;

    // Get all hiragana characters from kRomanji
    this.hiraganaList =
        Array.from(kRomanji.entries()).filter(([romanji,
                                                hiragana]) => romanji != 'N');

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
    this.ctx.strokeStyle = '#fff';
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
    document.getElementById('clear-btn')
        .addEventListener('click', () => this.clearCanvas());
    document.getElementById('reveal-btn')
        .addEventListener('click', () => this.revealAnswer());
    document.getElementById('next-btn')
        .addEventListener('click', () => this.nextCharacter());
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

  clearCanvas() {
    this.ctx.fillStyle = '#212121';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  revealAnswer() {
    const answerSection = document.getElementById('answer-value');
    answerSection.classList.remove('hidden');
  }

  nextCharacter() {
    // Clear canvas and hide answer
    this.clearCanvas();
    document.getElementById('answer-value').classList.add('hidden');

    // Update display
    const idx = Math.floor(Math.random() * this.hiraganaList.length);
    const current = this.hiraganaList[idx];
    document.getElementById('romanji-value').textContent = current[0];
    document.getElementById('answer-value').textContent = current[1];
  }
}

// Initialize the practice when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new HiraganaWritingPractice();
});
