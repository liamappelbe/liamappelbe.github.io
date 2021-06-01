Map = function(opt_init) {
  this.n = 0;
  this.a = {};
  if (opt_init) {
    if (opt_init instanceof Map) {
      this.n = opt_init.n;
      for (key in opt_init.a) {
        this.a[key] = opt_init.a[key];
      }
    } else {
      for (key in opt_init) {
        if (opt_init.hasOwnProperty(key)) {
          ++this.n;
          this.a['@' + key] = opt_init[key];
        }
      }
    }
  }
};

Map.prototype.get = function(key) {
  return this.a['@' + key];
};

Map.prototype.set = function(key, val) {
  var k = '@' + key;
  if (!this.a.hasOwnProperty(k)) {
    ++this.n;
  }
  this.a[k] = val;
};

Map.prototype.del = function(key) {
  var k = '@' + key;
  if (this.a.hasOwnProperty(k)) {
    --this.n;
    delete this.a[k];
  }
};

Map.prototype.has = function(key) {
  return this.a.hasOwnProperty('@' + key);
};

Map.prototype.clear = function() {
  this.n = 0;
  this.a = {};
};

Map.prototype.size = function() {
  return this.n;
};

Map.prototype.empty = function() {
  return this.n == 0;
};

Map.prototype.forEach = function(callback) {
  for (key in this.a) {
    callback(key.slice(1, key.length), this.a[key]);
  }
};

Map.prototype.validate = function() {
  // Conditions:
  // 1: Size is correct.
  // 2: All keys in loop are hasOwnProperty.
  // 3: All keys in loop begin with '@'.
  var m = 0;
  this.forEach(function(k, v) {
    ++m;
  });
  if (this.n != m) {
    throw new Error('Cached size is ' + this.n + ', actual size is ' + m + '.');
  }
  
  for (key in this.a) {
    if (!this.a.hasOwnProperty(key)) {
      throw new Error('This key is not hasOwnProperty: ' + key);
    }
    if (key.charAt(0) != '@') {
      throw new Error('This key doesn\'t start with \'@\': ' + key);
    }
  }
};
