Grid2 = function(cellSize, center, size) {
  this.cellSize = cellSize;
  this.offX = center.x - 0.5 * size.x;
  this.offY = center.y - 0.5 * size.y;

  // cell is an array of ALink {a: actor, i: cell's index in actor.gridData}
  // actor.gridData is an array of CLink {c: cell, j: actor's index in cell}
  this.c = [];
  for (var x = 0; x < size.x; x += cellSize) {
    var a = [];
    for (var y = 0; y < size.y; y += cellSize) {
      a.push(new Grid2.Cell([], this.c.length, a.length));
    }
    this.c.push(a);
  }

  this.e = [];
};

Grid2.ALink = function(a, i) {
  this.a = a;
  this.i = i;
};

Grid2.CLink = function(c, j) {
  this.c = c;
  this.j = j;
};

Grid2.Data = function() {
  this.c = [];
  this.p = {};
  this.pl = true;
};

Grid2.Cell = function(l, i, j) {
  this.l = l;
  this.i = i;
  this.j = j;
  this.k = 0;
};

Grid2.prototype.forEachCellInActor_ = function(actor, callback) {
  var pos = actor.getPos();
  var size = actor.getSize();
  var sx = size.x * 0.5;
  var sy = size.y * 0.5;
  var px = pos.x - this.offX;
  var py = pos.y - this.offY;
  var cs = this.cellSize;
  var maxx = this.c.length - 1;
  var maxy = this.c[0].length - 1;
  var lox = Math.min(Math.max(Math.floor((px - sx) / cs), 0), maxx);
  var loy = Math.min(Math.max(Math.floor((py - sy) / cs), 0), maxy);
  var hix = Math.min(Math.max(Math.floor((px + sx) / cs), 0), maxx);
  var hiy = Math.min(Math.max(Math.floor((py + sy) / cs), 0), maxy);
  for (var i = lox; i <= hix; ++i) {
    for (var j = loy; j <= hiy; ++j) {
      callback(this.c[i][j]);
    }
  }
};

Grid2.prototype.add = function(actor) {
  actor.gridData = new Grid2.Data();
  var e = this.e;
  this.forEachCellInActor_(actor, function(c) {
    var i = actor.gridData.c.length;
    var j = c.l.length;
    c.l.push(new Grid2.ALink(actor, i));
    actor.gridData.c.push(new Grid2.CLink(c, j));
    if (e[c.k] != c) {
      c.k = e.length;
      e.push(c);
    }
  });
};

Grid2.prototype.del = function(actor) {
  var d = actor.gridData.c;
  for (var i = 0; i < d.length; ++i) {
    var e = d[i];
    var ec = e.c;
    var c = ec.l;
    var j = e.j;
    c[j] = c[c.length - 1];
    c[j].a.gridData.c[c[j].i].j = j;
    c.pop();
    if (c.length == 0) {
      var k = ec.k;
      this.e[k] = this.e[this.e.length - 1];
      this.e[k].k = k;
      this.e.pop();
    }
  }
};

Grid2.prototype.update = function(actor) {
  this.del(actor);
  this.add(actor);
};

Grid2.actorsHit_ = function(act1, act2) {
  var s = act1.getSize().add(act2.getSize()).mulTo(0.5);
  var p1lo = act1.getPos().sub(s);
  var p1hi = act1.getPos().add(s);
  var p2 = act2.getPos();
  return p1lo.x <= p2.x && p2.x <= p1hi.x && p1lo.y <= p2.y && p2.y <= p1hi.y;
};

Grid2.prototype.forAllHits = function(callback) {
  var aca = [];
  for (var i = 0; i < this.e.length; ++i) {
    var c = this.e[i];
    var aa = [];
    for (var j = 0; j < c.l.length; ++j) {
      var ac = c.l[j].a;
      for (var k = 0; k < aa.length; ++k) {
        var ka = ac;
        var kb = aa[k];
        if (ka.getId() < kb.getId()) {
          ka = kb;
          kb = ac;
        }
        var key = kb.getId();
        if (!ka.gridData.p.hasOwnProperty(key)) {
          if (ka.gridData.pl) {
            aca.push(ka);
            ka.gridData.pl = false;
          }
          ka.gridData.p[key] = true;
          if (Grid2.actorsHit_(ka, kb)) {
            callback(ka, kb);
          }
        }
      }
      aa.push(ac);
    }
  }
  for (var i = 0; i < aca.length; ++i) {
    var gd = aca[i].gridData;
    gd.p = {};
    gd.pl = true;
  }
};

Grid2.prototype.forAllLayeredHits = function(otherGrid, callback) {
  var aca = [];
  for (var i = 0; i < this.e.length; ++i) {
    var c = this.e[i];
    var d = otherGrid.c[c.i][c.j];
    for (var j = 0; j < d.l.length; ++j) {
      var ad = d.l[j].a;
      for (var k = 0; k < c.l.length; ++k) {
        var ac = c.l[k].a;
        var key = ad.getId();
        if (!ac.gridData.p.hasOwnProperty(key)) {
          if (ac.gridData.pl) {
            aca.push(ac);
            ac.gridData.pl = false;
          }
          ac.gridData.p[key] = true;
          if (Grid2.actorsHit_(ac, ad)) {
            callback(ac, ad);
          }
        }
      }
    }
  }
  for (var i = 0; i < aca.length; ++i) {
    var gd = aca[i].gridData;
    gd.p = {};
    gd.pl = true;
  }
};

Grid2.prototype.validate = function() {
  for (var i = 0; i < this.c.length; ++i) {
    if (this.c[i].length != this.c[0].length) {
      throw new Error(
          'Inconsistent column lengths: ' +
          'c[0].length = ' + this.c[0].length + ', ' +
          'c[' + i + '].length = ' + this.c[i].length);
    }
    for (var j = 0; j < this.c[0].length; ++j) {
      var c = this.c[i][j];
      if (c.i != i) {
        throw new Error('Inconsistent i: ' + c);
      }
      if (c.j != j) {
        throw new Error('Inconsistent j: ' + c);
      }
      if (c.l.length != 0) {
        if (this.e[c.k] != c) {
          throw new Error('Full cell not in list: ' + c);
        }
      } else {
        if (this.e[c.k] == c) {
          throw new Error('Emtpy cell not in list: ' + c);
        }
      }
      for (var k = 0; k < c.l.length; ++k) {
        var al = c.l[k];
        var g = al.a.gridData;
        var d = g.c;
        if (!g.pl) {
          throw new Error('Pair flag false outside of hit loop: ');
        }
        for (key in g.p) {
          throw new Error('Pair set non-empty outside of hit loop: ');
        }
        if (d[al.i].c != c) {
          throw new Error('ALink inconsistent: ' + al);
        }
        for (var l = 0; l < d.length; ++l) {
          var cl = d[l];
          if (cl.c.l[cl.j].a != al.a) {
            throw new Error('CLink inconsistent: ' + cl);
          }
        }
      }
    }
  }
  for (var i = 0; i < this.e.length; ++i) {
    var c = this.e[i];
    if (c.k != i) {
      throw new Error('Inconsistent k in full cell list: ' + c);
    }
    if (c.length == 0) {
      throw new Error('Empty cell in full cell list: ' + c);
    }
  }
};
