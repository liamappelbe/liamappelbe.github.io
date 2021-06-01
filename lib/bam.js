load('lib/map.js');
load('lib/set.js');

Bam = function() {
  this.ab = new Map();
  this.ba = new Map();
};

Bam.prototype.set = function(a, b) {
  if (!this.ab.has(a)) {
    this.ab.set(a, new Set());
  }
  this.ab.get(a).set(b);
  if (!this.ba.has(b)) {
    this.ba.set(b, new Set());
  }
  this.ba.get(b).set(a);
};

Bam.prototype.has = function(a, b) {
  return this.ab.has(a) && this.ab.get(a).has(b);
};

Bam.prototype.hasA = function(a) {
  return this.ab.has(a);
};

Bam.prototype.hasB = function(b) {
  return this.ba.has(b);
};

Bam.prototype.del = function(a, b) {
  if (this.ab.has(a) && this.ab.get(a).has(b)) {
    this.ab.get(a).del(b);
    if (this.ab.get(a).empty()) {
      this.ab.del(a);
    }
  }
  if (this.ba.has(b) && this.ba.get(b).has(a)) {
    this.ba.get(b).del(a);
    if (this.ba.get(b).empty()) {
      this.ba.del(b);
    }
  }
};

Bam.prototype.delA = function(a) {
  if (this.ab.has(a)) {
    var ba = this.ba;
    this.ab.get(a).forEach(function(b) {
      ba.get(b).del(a);
      if (ba.get(b).empty()) {
        ba.del(b);
      }
    });
    this.ab.del(a);
  }
};

Bam.prototype.delB = function(b) {
  if (this.ba.has(b)) {
    var ab = this.ab;
    this.ba.get(b).forEach(function(a) {
      ab.get(a).del(b);
      if (ab.get(a).empty()) {
        ab.del(a);
      }
    });
    this.ba.del(b);
  }
};

Bam.prototype.clear = function() {
  this.ab = new Map();
  this.ba = new Map();
};

Bam.prototype.forEachA = function(callback) {
  this.ab.forEach(function(a, bs) {
    callback(a);
  });
};

Bam.prototype.forEachB = function(callback) {
  this.ba.forEach(function(b, as) {
    callback(b);
  });
};

Bam.prototype.forEachAinB = function(b, callback) {
  if (this.ba.has(b)) {
    this.ba.get(b).forEach(callback);
  }
};

Bam.prototype.forEachBinA = function(a, callback) {
  if (this.ab.has(a)) {
    this.ab.get(a).forEach(callback);
  }
};

Bam.prototype.validate = function() {
  // Conditions:
  // 1: The maps are valid.
  // 2: The sets are valid.
  // 3: Each A's Bs contain A.
  // 4: Each B's As contain B.
  // 5: All As have at least 1 B.
  // 6: All Bs have at least 1 A.
  
  var ab = this.ab;
  var ba = this.ba;

  ab.validate();
  ba.validate();

  ab.forEach(function(a, bs) {
    bs.validate();
  });

  ba.forEach(function(b, as) {
    as.validate();
  });
  
  ab.forEach(function(a, bs) {
    bs.forEach(function(b) {
      if (!ba.has(b) || !ba.get(b).has(a)) {
        throw new Error('This A->B didn\'t have B->A: ' + a + '->' + b);
      }
    });
  });
  
  ba.forEach(function(b, as) {
    as.forEach(function(a) {
      if (!ab.has(a) || !ab.get(a).has(b)) {
        throw new Error('This B->A didn\'t have A->B: ' + b + '->' + a);
      }
    });
  });
  
  ab.forEach(function(a, bs) {
    if (bs.empty()) {
      throw new Error('This A had no Bs: ' + a);
    }
  });

  ba.forEach(function(b, as) {
    if (as.empty()) {
      throw new Error('This B had no As: ' + b);
    }
  });
};


