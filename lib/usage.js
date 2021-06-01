Usage = function() {
  this.usage = 0;
  this.fps = 30;
  this.loopCount = 0;
  this.countSmooth = 0;
  this.useTime = 0;
  this.useStart = 0;
  this.lastTime = window.performance.now();
};

Usage.prototype.onLoop = function() {
  var currentTime = window.performance.now();
  var loopTime = currentTime - this.lastTime;
  var usage = this.useTime / loopTime;
  var fps = 1000.0 / loopTime;
  this.lastTime = currentTime;
  this.useTime = 0;
  this.usage += Usage.filter * (usage - this.usage);
  this.fps += Usage.filter * (fps - this.fps);
  this.countSmooth += Usage.filter * (this.loopCount - this.countSmooth);
  this.loopCount = 0;
};

Usage.filter = 0.01;

Usage.prototype.getUsage = function() {
  return this.usage;
};

Usage.prototype.getFPS = function() {
  return this.fps;
};

Usage.prototype.getCount = function() {
  return this.countSmooth;
};

Usage.prototype.begin = function() {
  this.useStart = window.performance.now();
};

Usage.prototype.end = function() {
  this.useTime += window.performance.now() - this.useStart;
};

Usage.prototype.count = function() {
  ++this.loopCount;
};