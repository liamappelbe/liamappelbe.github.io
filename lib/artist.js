load('lib/vec.js');

Artist = function(canvas) {
  this.context = canvas.getContext("2d");
  this.cameraPixelsPerCell = 30;
  this.cameraPositionInCells = new Vec(0, 0);
  this.cameraPixelsPerCellFunc = function(artist) { return 30; };
  this.showFps = false;
  this.fps = 60;
  this.lastTime = -1 / this.fps;
  this.stack = [];
  this.onResize();
};

Artist.prototype.save = function() {
  this.context.save();
  this.stack.push({
    pos: this.cameraPositionInCells,
    ppcFunc: this.cameraPixelsPerCellFunc,
  });
};

Artist.prototype.restore = function() {
  this.context.restore();
  const state = this.stack.pop();
  this.cameraPositionInCells = state.pos;
  this.cameraPixelsPerCellFunc = state.ppcFunc;
  this.onResize();
};

Artist.prototype.onResize = function() {
  this.resolution = new Vec(
      this.context.canvas.clientWidth, this.context.canvas.clientHeight);
  this.context.canvas.width = this.resolution.x;
  this.context.canvas.height = this.resolution.y;
  this.cameraPixelsPerCell = this.cameraPixelsPerCellFunc(this);
};

Artist.prototype.setCameraPixelsPerCellFunc = function(func) {
  this.cameraPixelsPerCellFunc = func;
  this.cameraPixelsPerCell = func(this);
};

Artist.prototype.setCameraPixelsPerCell = function(cameraPixelsPerCell) {
  this.setCameraPixelsPerCellFunc(function(artist) {
    return cameraPixelsPerCell;
  });
};

Artist.prototype.setCameraWidth = function(cameraWidthInCells) {
  this.setCameraPixelsPerCellFunc(function(artist) {
    return artist.resolution.x / cameraWidthInCells;
  });
};

Artist.prototype.setCameraHeight = function(cameraHeightInCells) {
  this.setCameraPixelsPerCellFunc(function(artist) {
    return artist.resolution.y / cameraHeightInCells;
  });
};

Artist.prototype.setCameraMinSize = function(cameraMinSizeInCells) {
  const cam = cameraMinSizeInCells;
  this.setCameraPixelsPerCellFunc(function(artist) {
    return artist.resolution.divV(cam).min();
  });
};

Artist.prototype.setCameraMaxSize = function(cameraMaxSizeInCells) {
  const cam = cameraMaxSizeInCells;
  this.setCameraPixelsPerCellFunc(function(artist) {
    return artist.resolution.divV(cam).max();
  });
};

Artist.prototype.setCameraPosition = function(cameraPositionInCells) {
  this.cameraPositionInCells = cameraPositionInCells.copy();
};

Artist.prototype.getCameraPosition = function() {
  return this.cameraPositionInCells.copy();
};

Artist.prototype.getCameraSize = function() {
  return this.resolution.div(this.cameraPixelsPerCell);
};

Artist.prototype.setShowFps = function(value) {
  this.showFps = value;
};

Artist.prototype.clear = function() {
  this.context.save();
  this.context.fillStyle = 'black';
  this.context.fillRect(0, 0, this.resolution.x, this.resolution.y);
  if (this.showFps) {
    const t = performance.now() / 1000;
    this.dt += Math.max(1 - 0.5 * this.lastTime, 0.1) * (t - this.lastTime - this.dt);
    if (isNaN(this.dt)) {
      this.dt = 60;
    }
    this.lastTime = t;
    this.context.fillStyle = 'white';
    this.context.font = '15px Arial';
    this.context.textAlign = 'left';
    this.context.fillText('FPS: ' + (1 / this.dt).toFixed(1), 10, 20);
  }
  this.context.restore();
};

Artist.prototype.draw = function(position, size, style) {
  this.context.save();
  var sizepx = size.mul(this.cameraPixelsPerCell);
  var pospx = new Vec(position.x, -position.y);
  pospx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
      addTo(this.resolution.sub(sizepx).mulTo(0.5));
  this.context.fillStyle = style;
  this.context.fillRect(pospx.x, pospx.y, sizepx.x, sizepx.y);
  this.context.restore();
};

Artist.prototype.drawLine = function(a, b, style, opt_width) {
  this.context.save();
  var apx = new Vec(a.x, -a.y);
  apx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
      addTo(this.resolution.mul(0.5));
  var bpx = new Vec(b.x, -b.y);
  bpx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
      addTo(this.resolution.mul(0.5));
  this.context.beginPath();
  this.context.strokeStyle = style;
  this.context.lineWidth = opt_width || 1;
  this.context.moveTo(apx.x, apx.y);
  this.context.lineTo(bpx.x, bpx.y);
  this.context.stroke();
  this.context.restore();
};

Artist.prototype.drawImage = function(position, size, rotation, image) {
  this.context.save();
  var sizepx = size.mul(this.cameraPixelsPerCell);
  var pospx = new Vec(position.x, -position.y);
  pospx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
      addTo(this.resolution.mul(0.5));
  this.context.translate(pospx.x, pospx.y);
  this.context.rotate(-rotation);
  this.context.drawImage(
      image, -sizepx.x / 2, -sizepx.y / 2, sizepx.x, sizepx.y);
  this.context.restore();
};

Artist.prototype.drawImageSharp = function(position, size, rotation, image) {
  this.context.save();
  this.context.imageSmoothingEnabled = false;
  this.context.webkitImageSmoothingEnabled = false;
  this.context.mozImageSmoothingEnabled = false;
  var sizepx = size.mul(this.cameraPixelsPerCell);
  var pospx = new Vec(position.x, -position.y);
  pospx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
      addTo(this.resolution.mul(0.5));
  this.context.translate(pospx.x, pospx.y);
  this.context.rotate(-rotation);
  this.context.drawImage(
      image, -sizepx.x / 2, -sizepx.y / 2, sizepx.x, sizepx.y);
  this.context.restore();
};

Artist.prototype.drawCap = function(a, b, r, style, opt_width) {
  this.context.save();
  this.context.strokeStyle = style;
  this.context.lineWidth = opt_width || 1;
  this.context.beginPath();
  r *= this.cameraPixelsPerCell;
  var ba = b.sub(a);
  var balsq = ba.lensq();
  if (balsq == 0) {
    var apx = new Vec(a.x, -a.y);
    apx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
        addTo(this.resolution.mul(0.5));
    this.context.arc(apx.x, apx.y, r, 0, 2 * Math.PI);
  } else {
    var apx = new Vec(a.x, -a.y);
    apx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
        addTo(this.resolution.mul(0.5));
    var bpx = new Vec(b.x, -b.y);
    bpx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
        addTo(this.resolution.mul(0.5));
    ba.mulTo(r / Math.sqrt(balsq)).rot90To();
    ba.y = -ba.y;
    var p0 = apx.add(ba);
    var p1 = bpx.add(ba);
    var p2 = apx.sub(ba);
    var p3 = bpx.sub(ba);
    var th = ba.angle();
    var thp = th + Math.PI;
    this.context.moveTo(p0.x, p0.y);
    this.context.lineTo(p1.x, p1.y);
    this.context.arc(bpx.x, bpx.y, r, th, thp);
    this.context.moveTo(p2.x, p2.y);
    this.context.lineTo(p3.x, p3.y);
    this.context.arc(apx.x, apx.y, r, thp, th);
  }
  this.context.stroke();
  this.context.restore();
};

Artist.prototype.drawText = function(position, text, style, font, align) {
  var pospx = new Vec(position.x, -position.y);
  pospx.subTo(this.cameraPositionInCells).mulTo(this.cameraPixelsPerCell).
      addTo(this.resolution.mul(0.5));
  this.context.fillStyle = style;
  this.context.font = font;
  this.context.textAlign = align;
  this.context.fillText(text, pospx.x, pospx.y);
};

