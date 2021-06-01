function bind(callback, self, args) {
  if (arguments.length <= 2) {
    return function() { callback.apply(self, arguments); };
  } else {
    var a = [];
    for (var i = 2; i < arguments.length; ++i) {
      a[a.length] = arguments[i];
    }
    return function() {
      for (var i = 0; i < arguments.length; ++i) {
        a[a.length] = arguments[i];
      }
      return callback.apply(self, a);
    };
  }
}