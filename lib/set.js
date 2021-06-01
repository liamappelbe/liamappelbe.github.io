Set = function(opt_init) {
  this.n = 0;
  this.a = {};
  if (opt_init) {
    if (opt_init instanceof Set) {
      this.n = opt_init.n;
      for (key in opt_init.a) {
        this.a[key] = true;
      }
    } else if (opt_init instanceof Array) {
      for (i in opt_init) {
        this.set(opt_init[i]);
      }
    } else {
      for (key in opt_init) {
        if (opt_init.hasOwnProperty(key)) {
          ++this.n;
          this.a['@' + key] = true;
        }
      }
    }
  }
};

Set.prototype.set = function(key) {
  var k = '@' + key;
  if (!this.a.hasOwnProperty(k)) {
    ++this.n;
    this.a[k] = true;
  }
};

Set.prototype.del = function(key) {
  var k = '@' + key;
  if (this.a.hasOwnProperty(k)) {
    --this.n;
    delete this.a[k];
  }
};

Set.prototype.has = function(key) {
  return this.a.hasOwnProperty('@' + key);
};

Set.prototype.clear = function() {
  this.n = 0;
  this.a = {};
};

Set.prototype.size = function() {
  return this.n;
};

Set.prototype.empty = function() {
  return this.n == 0;
};

Set.prototype.forEach = function(callback) {
  for (key in this.a) {
    callback(key.slice(1, key.length));
  }
};

Set.prototype.validate = function() {
  // Conditions:
  // 1: Size is correct.
  // 2: All keys in loop are hasOwnProperty.
  // 3: All keys in loop begin with '@'.
  // 4: All values are identical to true.
  var m = 0;
  this.forEach(function(k) {
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
    if (this.a[key] !== true) {
      throw new Error(
          'This key\'s value isn\'t true: ' + key + ' = ' + this.a[key]);
    }
  }
};

