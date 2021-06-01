Vec = function(x, y) {
  this.x = x;
  this.y = y;
};

Vec.prototype.set = function(x, y) {
  this.x = x;
  this.y = y;
  return this;
};

Vec.prototype.copy = function() {
  return new Vec(this.x, this.y);
};

Vec.prototype.neg = function() {
  return new Vec(-this.x, -this.y);
};

Vec.prototype.add = function(a) {
  return new Vec(this.x + a.x, this.y + a.y);
};

Vec.prototype.sub = function(a) {
  return new Vec(this.x - a.x, this.y - a.y);
};

Vec.prototype.mul = function(a) {
  return new Vec(this.x * a, this.y * a);
};

Vec.prototype.div = function(a) {
  return new Vec(this.x / a, this.y / a);
};

Vec.prototype.dot = function(a) {
  return this.x * a.x + this.y * a.y;
};

Vec.prototype.sdot = function(a) {
  return this.x * a.y - this.y * a.x;
};

Vec.prototype.mulV = function(a) {
  return new Vec(this.x * a.x, this.y * a.y);
};

Vec.prototype.divV = function(a) {
  return new Vec(this.x / a.x, this.y / a.y);
};

Vec.prototype.negTo = function() {
  this.x = -this.x;
  this.y = -this.y;
  return this;
};

Vec.prototype.addTo = function(a) {
  this.x += a.x;
  this.y += a.y;
  return this;
};

Vec.prototype.subTo = function(a) {
  this.x -= a.x;
  this.y -= a.y;
  return this;
};

Vec.prototype.mulTo = function(a) {
  this.x *= a;
  this.y *= a;
  return this;
};

Vec.prototype.divTo = function(a) {
  this.x /= a;
  this.y /= a;
  return this;
};

Vec.prototype.mulVTo = function(a) {
  this.x *= a.x;
  this.y *= a.y;
  return this;
};

Vec.prototype.divVTo = function(a) {
  this.x /= a.x;
  this.y /= a.y;
  return this;
};

Vec.prototype.floorTo = function() {
  this.x = Math.floor(this.x);
  this.y = Math.floor(this.y);
  return this;
};

Vec.prototype.ceilTo = function() {
  this.x = Math.ceil(this.x);
  this.y = Math.ceil(this.y);
  return this;
};

Vec.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vec.prototype.lensq = function() {
  return this.x * this.x + this.y * this.y;
};

Vec.prototype.angle = function() {
  return Math.atan2(this.y, this.x);
};

Vec.prototype.unit = function() {
  return this.div(this.length());
};

Vec.prototype.unitTo = function() {
  return this.divTo(this.length());
};

Vec.prototype.limitRadius = function(radius) {
  var r = this.length();
  if (r > radius) {
    return this.div(r / radius);
  }
  return this;
};

Vec.prototype.abs = function() {
  return new Vec(Math.abs(this.x), Math.abs(this.y));
};

Vec.prototype.absTo = function() {
  this.x = Math.abs(this.x);
  this.y = Math.abs(this.y);
  return this;
};

Vec.prototype.min = function() {
  return this.x < this.y ? this.x : this.y;
};

Vec.prototype.max = function() {
  return this.x > this.y ? this.x : this.y;
};

Vec.prototype.rot90 = function() {
  return new Vec(-this.y, this.x);
};

Vec.prototype.rot90To = function() {
  var temp = this.x;
  this.x = -this.y;
  this.y = temp;
  return this;
};

Vec.prototype.rot90n = function() {
  return new Vec(this.y, -this.x);
};

Vec.prototype.rot90nTo = function() {
  var temp = this.x;
  this.x = this.y;
  this.y = -temp;
  return this;
};

Vec.prototype.rotMul = function(rotor) {
  return new Vec(rotor.x * this.x - rotor.y * this.y,
                 rotor.y * this.x + rotor.x * this.y);
};

Vec.prototype.rotMulTo = function(rotor) {
  var temp = this.x;
  this.x = rotor.x * this.x - rotor.y * this.y,
  this.y = rotor.y * temp + rotor.x * this.y;
  return this;
};

Vec.prototype.rotnMul = function(rotor) {
  return new Vec(-rotor.x * this.x + rotor.y * this.y,
                 -rotor.y * this.x - rotor.x * this.y);
};

Vec.prototype.rotnMulTo = function(rotor) {
  var temp = this.x;
  this.x = -rotor.x * this.x + rotor.y * this.y,
  this.y = -rotor.y * temp - rotor.x * this.y;
  return this;
};

Vec.sincos = function(angle) {
  return new Vec(Math.cos(angle), Math.sin(angle));
};

Vec.radial = function(radius, angle) {
  return Vec.sincos(angle).mulTo(radius);
};

Vec.randWithRadius = function(radius) {
  return Vec.radial(radius, Math.PI * 2 * Math.random());
};

Vec.prototype.toString = function() {
  return '(' + this.x + ', ' + this.y + ')';
};
