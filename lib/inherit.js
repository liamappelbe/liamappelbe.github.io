// This function makes the childClass inherit all the properties of the
// parentClass. You need to call the parentClass's constructor, using
// this.base(...), like this:
/*
function Parent(a) { this.a = a;}
Parent.prototype.foo = function() { console.log(this.a); }
Parent.prototype.bar = function() { console.log('def'); }

function Child() { this.base('abc'); }
inherit(Child, Parent);
Child.prototype.bar = function() { console.log('ghi'); }

var c = new Child();
c.foo();  // 'abc'
c.bar();  // 'ghi'
console.log(c instanceof Child);  // true
console.log(c instanceof Parent);  // true
console.log(c.constructor === Child);  // true
*/

/*function inherit(childClass, parentClass) {
  function tempClass() {};
  tempClass.prototype = parentClass.prototype;
  childClass.prototype = new tempClass();
  childClass.prototype.constructor = childClass;
  childClass.prototype.base = function() {
    return parentClass.prototype.constructor.apply(this, arguments);
  };
};*/




// This function makes a child class inherit all the properties of the a parent
// class. Call it from inside the child class's constructor, like this:
/*
function Parent(a) { this.a = a;}
Parent.prototype.foo = function() { console.log(this.a); }
Parent.prototype.bar = function() { console.log('def'); }

function Child() { inherit(this, Parent, 'abc'); }
Child.prototype.bar = function() { console.log('ghi'); }

var c = new Child();
c.foo();  // 'abc'
c.bar();  // 'ghi'
console.log(c instanceof Child);  // true
console.log(c instanceof Parent);  // false (TODO: find a way to fix this)
console.log(c.constructor === Child);  // true
*/

function inherit(self, parentClass, arg) {
  for (key in parentClass.prototype) {
    if (self[key] === undefined) {
      self[key] = parentClass.prototype[key];
    }
  }
  var a = new Array(arguments.length - 2);
  for (var i = 2; i < arguments.length; i++) {
    a[i - 2] = arguments[i];
  }
  parentClass.prototype.constructor.apply(self, a);
};
