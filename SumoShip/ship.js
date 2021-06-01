load('lib/vec.js');
load('SumoShip/lump.js');

Ship = function(id, frame, color, initPos) {
  this.id = id;
  this.frame = frame;
  this.color = color;
  this.lastCmd = new Vec(0, 0);
  this.lines = [];
  this.pos = initPos.copy();
  this.vel = new Vec(0, 0);
  this.rot = 0;
  this.rotor = new Vec(1, 0);
  this.rvel = 0;
  this.alive = true;
  this.buildShip();
};

Ship.img = loadImage('SumoShip/ship.png');

Ship.mass = 1;
Ship.momin = 0.1;
Ship.rktpx = 0.3;
Ship.rktpy = -0.1;
Ship.sizex = 0.4;
Ship.sizey = 0.2;
Ship.lineRad = 0.1;
Ship.corest = 0.2;

Ship.prototype.onLoop = function(dt, grav, thrustMul, size) {
  var lf = thrustMul * Ship.mass * this.lastCmd.x;
  var rf = thrustMul * Ship.mass * this.lastCmd.y;
  var t = (rf - lf) * Ship.rktpx;  // r * sin(theta) == px   in this case.
  this.rotor.rot90To();
  var f = grav.mul(Ship.mass).addTo(this.rotor.mul(lf)).addTo(
    this.rotor.mul(rf));
  this.vel.addTo(f.mul(dt / Ship.mass));
  this.pos.addTo(this.vel.mul(dt));  // TODO: Add effect of acceleration???
  this.rvel += t * dt / Ship.momin;
  this.rot += this.rvel * dt;  // TODO: Add effect of acceleration???
  this.rot = this.rot % (2 * Math.PI);
  this.rotor = Vec.sincos(this.rot);

  if (this.isOOB(size)) {
    this.alive = false;
  }
};

Ship.prototype.getGlobalVec = function(localVec) {
  return localVec.rotMul(this.rotor).addTo(this.pos);
};

Ship.prototype.getGlobalDir = function(localDir) {
  return localDir.rotMul(this.rotor);
};

Ship.prototype.getLocalVec = function(globalVec) {
  return globalVec.subTo(this.pos).rotnMul(this.rotor);
};

Ship.prototype.getLocalDir = function(globalDir) {
  return globalDir.rotnMul(this.rotor);
};

Ship.prototype.isOOB = function(size) {
  var e = size.div(2);
  for (i in this.lines) {
    var l = this.lines[i];
    var h = Ship.lineInt(new Vec(-e.x, 0), new Vec(e.x, 0),
      this.getGlobalVec(l.a), this.getGlobalVec(l.b));
    var v = Ship.lineInt(new Vec(0, -e.y), new Vec(0, e.y),
      this.getGlobalVec(l.a), this.getGlobalVec(l.b));
    if (h.p.sub(h.q).length() < (e.y + l.r) &&
        v.p.sub(v.q).length() < (e.x + l.r)) {
      return false;
    }
  }
  return true;
};

Ship.prototype.setCmd = function(cmd) {
  this.lastCmd = cmd;
};

Ship.prototype.getState = function() {
  return {
    px: this.pos.x,
    py: this.pos.y,
    r: this.rot,
    vx: this.vel.x,
    vy: this.vel.y,
    w: this.rvel,
    alive: this.alive,
  };
};

Ship.prototype.onDraw = function(artist) {
  //artist.drawImage(
  //  this.pos, new Vec(Ship.sizex, Ship.sizey), this.rot, Ship.img);
  artist.drawImage(
    this.getGlobalVec(new Vec(Ship.sizex, -Ship.sizey - Ship.lineRad)),
    new Vec(0.03, 0.06), this.rot, Ship.img);
  artist.drawImage(
    this.getGlobalVec(new Vec(-Ship.sizex, -Ship.sizey - Ship.lineRad)),
    new Vec(0.03, 0.06), this.rot, Ship.img);
  for (i in this.lines) {
    var l = this.lines[i];
    artist.drawCap(
      this.getGlobalVec(l.a), this.getGlobalVec(l.b), l.r, this.color);
  }
};

Ship.prototype.addLine = function(ax, ay, bx, by, r) {
  var l = {a: new Vec(ax, ay), b: new Vec(bx, by), r: r};
  this.lines.push(l);
  return l;
};

Ship.prototype.buildShip = function() {
  this.addLine(-Ship.sizex, 0, Ship.sizex, 0, Ship.lineRad);
  this.addLine(-Ship.sizex, -Ship.sizey, -Ship.sizex, Ship.sizey, Ship.lineRad);
  this.addLine(Ship.sizex, -Ship.sizey, Ship.sizex, Ship.sizey, Ship.lineRad);
};

Ship.clamp = function(x) {
  return x <= 0 ? 0 : x >= 1 ? 1 : x;
};

Ship.lineInt = function(a, b, c, d) {
  // Note: This function imperfectly handles the case where the 2 lines are
  // parallel, and exactly one of the endpoints of both segments project onto
  // each other. In this case, instead of being the midpoint of the overlap,
  // it will be either 1/4 or 3/4 of the way along the overlap (exactly which
  // depends on the pair). However this failure mode is ok, and the case is
  // exceedingly rare (parallel alone should be rare enough).

  // First, find the intersection of the lines. If the intersection is within
  // both segments, return it.
  var ba = b.sub(a);
  var ca = c.sub(a);
  var dc = d.sub(c);

  // Calculate and check each value one at a time to bail early where possible.
  var k = ba.sdot(dc);
  if (k != 0) {
    var u = ca.sdot(dc) / k;
    if (u >= 0 && u <= 1) {
      var v = ca.sdot(ba) / k;
      if (v >= 0 && v <= 1) {
        var p = a.add(ba.mul(u));
        var q = c.add(dc.mul(v));
        var pq = p.addTo(q).mulTo(0.5);
        return {
          p: pq,
          q: pq,
          i: true,
        };
      }
    }
  }

  // Otherwise, find all the projections of all the endpoints, limit them to
  // [0, 1], and return the pair that is the closest.
  var bc = b.sub(c);
  var da = d.sub(a);
  var dcl = dc.lensq();
  var bal = ba.lensq();

  var ua = 0, ub = 0;
  if (dcl > 0) {
    ua = Ship.clamp(-(ca.dot(dc) / dcl));
    ub = Ship.clamp(bc.dot(dc) / dcl);
  }
  var uc = 0, ud = 0;
  if (bal > 0) {
    uc = Ship.clamp(ca.dot(ba) / bal);
    ud = Ship.clamp(da.dot(ba) / bal);
  }

  var mp = a.copy();
  var mq = c.add(dc.mul(ua));
  var mr = mp.sub(mq).lensq();

  var np = b.copy();
  var nq = c.add(dc.mul(ub));
  var nr = np.sub(nq).lensq();
  if (nr < mr) {
    mp = np;
    mq = nq;
    mr = nr;
  } else if (nr == mr) {
    mp.addTo(np).divTo(2);
    mq.addTo(nq).divTo(2);
  }

  np = a.add(ba.mul(uc));
  nq = c.copy();
  nr = np.sub(nq).lensq();
  if (nr < mr) {
    mp = np;
    mq = nq;
    mr = nr;
  } else if (nr == mr) {
    mp.addTo(np).divTo(2);
    mq.addTo(nq).divTo(2);
  }

  np = a.add(ba.mul(ud));
  nq = d.copy();
  nr = np.sub(nq).lensq();
  if (nr < mr) {
    mp = np;
    mq = nq;
    mr = nr;
  } else if (nr == mr) {
    mp.addTo(np).divTo(2);
    mq.addTo(nq).divTo(2);
  }

  return {
    p: mp,
    q: mq,
    i: false,
  };
};

Ship.collide = function(s0, s1) {
  for (i0 in s0.lines) {
    var l0 = s0.lines[i0];
    for (i1 in s1.lines) {
      var l1 = s1.lines[i1];
      var h = Ship.lineInt(
        s0.getGlobalVec(l0.a), s0.getGlobalVec(l0.b),
        s1.getGlobalVec(l1.a), s1.getGlobalVec(l1.b));
      var rr = l0.r + l1.r;
      var qp = h.q.sub(h.p);
      var qpl = qp.length();

      // TODO: Handle intersection (qpl == 0).
      if(qpl > 0 && qpl < rr) {
        var norm = qp.div(qpl);
        var pnt = h.p.add(norm.mul(l0.r)).addTo(h.q).subTo(
          norm.mul(l1.r)).mulTo(0.5);
        var rA = pnt.sub(s0.pos);
        var rB = pnt.sub(s1.pos);
        var C = rr - qpl;
        var rnA = rA.sdot(norm);
        var rnB = rB.sdot(norm);
        var K = 2 * Ship.mass + Ship.momin * (rnA * rnA + rnB * rnB);
        var normMass = K > 0 ? 1 / K : 0;
        var imp = C * normMass;
        var P = norm.mul(imp);
        var v0 = rA.rot90().mul(s0.rvel).addTo(s0.vel);
        var v1 = rB.rot90().mul(s1.rvel).addTo(s1.vel);
        var dv = v1.sub(v0);
        var vn = dv.dot(norm);
        var lam = -normMass * (vn * (1 + Ship.corest));
        var vP = norm.mul(lam);
        s0.hit(
          P.mul(-Ship.mass), -Ship.momin * rA.sdot(P),
          vP.mul(-Ship.mass), -Ship.momin * rA.sdot(vP));
        s1.hit(
          P.mul(Ship.mass), Ship.momin * rB.sdot(P),
          vP.mul(Ship.mass), Ship.momin * rB.sdot(vP));
      }
    }
  }
};

Ship.prototype.hit = function(p, r, v, w) {
  this.pos.addTo(p);
  this.rot += r;
  this.vel.addTo(v);
  this.rvel += w;
  this.rot = this.rot % (2 * Math.PI);
  this.rotor = Vec.sincos(this.rot);
};
