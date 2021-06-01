load('lib/bam.js');
load('lib/map.js');
load('lib/set.js');
load('lib/vec.js');

// Actor.getPos()
// Actor.getSize()
// Actor.getId()

Grid = function(cellSize) {
  this.cellSize = cellSize;
  this.actors = new Map();
  this.m = new Bam();  // A = Actor, B = Cell.
};

Grid.prototype.forEachCellIdInActor_ = function(actor, callback) {
  var pos = actor.getPos();
  var size = actor.getSize().mul(0.5);
  var lo = pos.sub(size).divTo(this.cellSize).floorTo();
  var hi = pos.add(size).divTo(this.cellSize).floorTo();
  for (var i = lo.x; i <= hi.x; ++i) {
    for (var j = lo.y; j <= hi.y; ++j) {
      callback(i + ' ' + j);
    }
  }
};

Grid.prototype.delInternal_ = function(actor) {
  this.m.delA(actor.getId());
};

Grid.prototype.addInternal_ = function(actor) {
  var actorId = actor.getId();
  var mm = this.m;
  this.forEachCellIdInActor_(actor, function(cellId) {
    mm.set(actorId, cellId);
  });
};

Grid.prototype.del = function(actor) {
  this.actors.del(actor.getId());
  this.delInternal_(actor);
};

Grid.prototype.add = function(actor) {
  this.actors.set(actor.getId(), actor);
  this.addInternal_(actor);
};

Grid.prototype.update = function(actor) {
  // Brute force update.
  //this.delInternal_(actor);
  //this.addInternal_(actor);

  // Incremental update. (is this actually faster?)
  // Get the set of all cells the actor now touches.
  // For each cell for the actor in the map:
  //   if it is in the new set, del it from the new set
  //   if it's not in the new set, del it from the bam
  // Add all new cells to the bam.
  var newCells = new Set();
  var actId = actor.getId();
  var mm = this.m;
  this.forEachCellIdInActor_(actor, function(cellId) {
    newCells.set(cellId);
  });
  mm.forEachBinA(actId, function(cellId) {
    if (newCells.has(cellId)) {
      newCells.del(cellId);
    } else {
      mm.del(actId, cellId);
    }
  });
  newCells.forEach(function(cellId) {
    mm.set(actId, cellId);
  })
};

Grid.actorsHit_ = function(act1, act2) {
  var s = act1.getSize().add(act2.getSize()).mulTo(0.5);
  var p1lo = act1.getPos().sub(s);
  var p1hi = act1.getPos().add(s);
  var p2 = act2.getPos();
  return p1lo.x <= p2.x && p2.x <= p1hi.x && p1lo.y <= p2.y && p2.y <= p1hi.y;
};

Grid.prototype.forAllHits = function(callback) {
  // Get all unique pairs of actors that share a cell, and check if they hit.
  var pairs = new Map();
  var m = this.m;
  var actors = this.actors;
  m.forEachB(function(cellId) {
    var actorIds = [];
    m.forEachAinB(cellId, function(actorId) {
      for (var i = 0; i < actorIds.length; ++i) {
        var id1 = actorId;
        var id2 = actorIds[i];
        if (id1 > id2) {
          id1 = id2;
          id2 = actorId;
        }
        if (!pairs.has(id1)) {
          pairs.set(id1, new Set());
        }
        if (!pairs.get(id1).has(id2)) {
          pairs.get(id1).set(id2);
          var act1 = actors.get(id1);
          var act2 = actors.get(id2);
          if (Grid.actorsHit_(act1, act2)) {
            callback(act1, act2);
          }
        }
      }
      actorIds.push(actorId);
    });
  });
};

Grid.prototype.forAllLayeredHits = function(otherGrid, callback) {
  // For each cell in the intersection of the layers:
  //   Get an array of all the actors in the cell in each layer.
  //   For each actor in array a:
  //     For each actor in array b:
  //       If this pair is not in the set of pairs:
  //         add it to the set
  //         if they hit, run the callback
  var pairs = new Map();
  var m = this.m;
  var actors = this.actors;
  var bctors = otherGrid.actors;
  m.forEachB(function(cellId) {
    if (otherGrid.m.hasB(cellId)) {
      as = [];
      m.forEachAinB(cellId, function(ida) {
        as.push(ida);
      });
      bs = [];
      otherGrid.m.forEachAinB(cellId, function(idb) {
        bs.push(idb);
      });
      for (i in as) {
        for (j in bs) {
          var ida = as[i];
          var idb = bs[j];
          if (!pairs.has(ida)) {
            pairs.set(ida, new Set());
          }
          if (!pairs.get(ida).has(idb)) {
            pairs.get(ida).set(idb);
            var acta = actors.get(ida);
            var actb = bctors.get(idb);
            if (Grid.actorsHit_(acta, actb)) {
              callback(acta, actb);
            }
          }
        }
      }
    }
  });
};
