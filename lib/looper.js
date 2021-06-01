load('lib/bind.js');

Looper = function(callback, loopTimeMs) {
  this.callback = callback;
  this.loopTimeMs = loopTimeMs;
  this.delay = 0;
  this.lastTime = window.performance.now() - loopTimeMs;
  this.onLoop();
};

Looper.prototype.onLoop = function() {
  var currentTime = window.performance.now();
  var delta = currentTime - this.lastTime;
  this.delay += this.loopTimeMs - delta;
  if (this.delay < 0) this.delay = 0;
  this.lastTime = currentTime;
  this.callback();
  window.setTimeout(bind(this.onLoop, this), this.delay);
};