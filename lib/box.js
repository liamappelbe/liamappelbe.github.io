// Rather than define a Box class, just give built-in arrays a del method.
Array.prototype.del = function(i) {
  this[i] = this[this.length - 1];
  this.pop();
};