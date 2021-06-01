Timer = function() {
  this.reset();
};

Timer.prototype.reset = function() {
  this.t = window.performance.now();
};

Timer.prototype.get = function() {
  return (window.performance.now() - this.t) / 1000;
};
