load('lib/vec.js');

/*

var physics = new Phys();
physics.setGravity(new Vec(0, -9.81)).setTimeStep(1.0 / 60);
var movableBody = physics.newBody()
  .setPos(posVec, rot)
  .setVel(velVec, rotVel)
  .setMass(mass, momin)
  .addCap(A, B, r, friction, restitution);
var static = physics.newStatic()
  .setPos(posVec, rot).addCap(...).addCap(...).addCap(...);

*/


Phys = function() {
  // TODO: Use Grid2 to reduce unnecessary collision checks.
  // TODO: Cache the rotors of the bodies.
  this.bodies = [];
  this.statics = [];
  this.grav = new Vec(0, 0);
  this.dt = 1.0 / 60;
};

Phys.TAU = 2 * Math.PI;

Phys.prototype.setTimeStep = function(timeStep) {
  this.dt = timeStep;
  return this;
};

Phys.prototype.setGravity = function(gravity) {
  this.grav.set(gravity.x, gravity.y);
  return this;
};

Phys.prototype.update = function() {
  // Apply forces to all bodies.
  for (var i = 0; i < this.bodies.length; ++i) {
    this.force_(this.bodies[i], this.grav);
  }

  // Resolve collisions between bodies.
  for (var i = 1; i < this.bodies.length; ++i) {
    for (var j = 0; j < i; ++j) {
      Phys.collide_(this.bodies[i], this.bodies[j]);
    }
  }

  // Resolve collisions between statics and bodies.
  for (var i = 0; i < this.bodies.length; ++i) {
    for (var j = 0; j < this.statics.length; ++j) {
      Phys.collide_(this.bodies[i], this.statics[j]);
    }
  }

  // Normalize rotations.
  for (var i = 0; i < this.bodies.length; ++i) {
    this.bodies[i].fixRot();
  }
};

Phys.prototype.newBody = function() {
  return new Phys.Body(this.bodies);
};

Phys.prototype.newStatic = function() {
  return new Phys.Body(this.statics);
};

Phys.prototype.destroy = function() {
  for (var i = 0; i < this.statics; ++i) {
    this.statics[i].destroy();
  }
  for (var i = 0; i < this.bodies; ++i) {
    this.bodies[i].destroy();
  }
};

// Draw all the bodies. Useful for debugging.
Phys.prototype.draw = function(artist) {
  for (var i = 0; i < this.statics.length; ++i) {
    this.statics[i].draw(artist, "gray");
  }
  for (var i = 0; i < this.bodies.length; ++i) {
    this.bodies[i].draw(artist, "white");
  }
};



Phys.Body = function(list) {
  this.list = list;
  this.id = list.length;
  this.list.push(this);

  this.m = 0;
  this.im = 0;
  this.I = 0;
  this.iI = 0;
  this.d = 0;
  this.e = 0;
  this.p = new Vec(0, 0);
  this.r = 0;
  this.v = new Vec(0, 0);
  this.w = 0;
  this.f = new Vec(0, 0);
  this.a = 0;
  this.s = [];
};

Phys.Body.prototype.destroy = function() {
  if (this.id >= this.list.length || this.list[this.id] != this) {
    console.log("Error in body list. Did you double destroy somethig?");
  } else if (this.id == this.list.length - 1) {
    this.list.pop();
  } else {
    this.list[this.id] = this.list.pop();
    this.list[this.id].id = this.id;
  }
};

Phys.Body.prototype.setPos = function(pos, rot) {
  this.p.set(pos.x, pos.y);
  this.r = rot;
  return this;
};

Phys.Body.prototype.setVel = function(vel, rotVel) {
  this.v.set(vel.x, vel.y);
  this.w = rotVel;
  return this;
};

Phys.Body.prototype.setMass = function(mass, momin) {
  this.m = mass;
  this.im = this.m == 0 ? 0 : 1 / this.m;
  this.I = momin;
  this.iI = this.I == 0 ? 0 : 1 / this.I;
  return this;
};

Phys.Body.prototype.setDamp = function(linearDamping, angularDamping) {
  this.d = 1 - linearDamping;
  this.e = 1 - angularDamping;
  return this;
};

Phys.Body.prototype.addCap = function(a, b, rad, fric, rest) {
  this.s.push(new Phys.Cap(a, b, rad, fric, rest));
  return this;
};

Phys.Body.prototype.addLocalForce = function(localForce, localPos) {
  const globalForce = this.toGlobalDir(localForce);
  this.f.x += globalForce.x;
  this.f.y += globalForce.y;
  this.a +=
    localPos.x * localForce.y -
    localPos.y * localForce.x;
  return this;
};

Phys.Body.prototype.addGlobalForce = function(globalForce, globalPos) {
  this.f.x += globalForce.x;
  this.f.y += globalForce.y;
  this.a +=
    (globalPos.x - this.p.x) * globalForce.y -
    (globalPos.y - this.p.y) * globalForce.x;
  return this;
};

Phys.Body.prototype.addLocalLinearForce = function(globalForce) {
  const globalForce = this.toGlobalDir(localForce);
  this.f.x += globalForce.x;
  this.f.y += globalForce.y;
  return this;
};

Phys.Body.prototype.addGlobalLinearForce = function(globalForce) {
  this.f.x += globalForce.x;
  this.f.y += globalForce.y;
  return this;
};

Phys.Body.prototype.addRotForce = function(rotationalForce) {
  this.a += rotationalForce;
  return this;
};

Phys.Body.prototype.toGlobal = function(local) {
  return local.rotMul(Vec.sincos(this.r)).addTo(this.p);
};

Phys.Body.prototype.toLocal = function(global) {
  return global.sub(this.p).rotnMulTo(Vec.sincos(this.r));
};

Phys.Body.prototype.toGlobalDir = function(localDir) {
  return localDir.rotMul(Vec.sincos(this.r));
};

Phys.Body.prototype.toLocalDir = function(globalDir) {
  return globalDir.rotnMulTo(Vec.sincos(this.r));
};

Phys.Body.prototype.getVelAtGlobal = function(globalPos) {
  return new Vec(
    this.v.x - (globalPos.y - this.p.y) * this.w,
    this.v.y + (globalPos.x - this.p.x) * this.w);
};

Phys.Body.prototype.fixRot = function() {
  this.r = ((((this.r + Math.PI) % Phys.TAU) + Phys.TAU) % Phys.TAU) - Math.PI;
  return this;
};

// Draw the body. Useful for debugging.
Phys.Body.prototype.draw = function(artist, style) {
  artist.drawLine(this.p, this.toGlobal(new Vec(1, 0)), style);
  artist.drawLine(this.p, this.toGlobal(new Vec(0, 1)), style);
  for (var i = 0; i < this.s.length; ++i) {
    artist.drawCap(
      this.toGlobal(this.s[i].a),
      this.toGlobal(this.s[i].b),
      this.s[i].r, style, 1);
  }
};



Phys.Cap = function(a, b, rad, fric, rest) {
  this.a = new Vec(a.x, a.y);
  this.b = new Vec(b.x, b.y);
  this.r = rad;
  this.fric = fric;
  this.rest = rest;
};



// Resolve collisions betwen 2 bodies.
Phys.collide_ = function(b0, b1) {
  const im0 = b0.im;
  const im1 = b1.im;
  const iI0 = b0.iI;
  const iI1 = b1.iI;
  for (var i0 = 0; i0 < b0.s.length; ++i0) {
    const s0 = b0.s[i0];
    for (var i1 = 0; i1 < b1.s.length; ++i1) {
      const s1 = b1.s[i1];
      const h = Phys.lineInt_(
        b0.toGlobal(s0.a), b0.toGlobal(s0.b),
        b1.toGlobal(s1.a), b1.toGlobal(s1.b));
      const rr = s0.r + s1.r;
      const qpx = h.q.x - h.p.x;
      const qpy = h.q.y - h.p.y;
      const qpl = Math.sqrt(qpx * qpx + qpy * qpy);

      if(qpl > 0 && (h.i || qpl < rr)) {
        const normx = qpx / qpl;
        const normy = qpy / qpl;
        const poix = (h.p.x + h.q.x + normx * (s0.r - s1.r)) * 0.5;
        const poiy = (h.p.y + h.q.y + normy * (s0.r - s1.r)) * 0.5;
        const rest = Math.sqrt(s0.rest * s1.rest);
        const fric = Math.sqrt(s0.fric * s1.fric);
        const r0x = poix - b0.p.x;
        const r0y = poiy - b0.p.y;
        const r1x = poix - b1.p.x;
        const r1y = poiy - b1.p.y;
        const rn0 = r0x * normy - r0y * normx;
        const rn1 = r1x * normy - r1y * normx;
        const kn = im0 + im1 + iI0 * rn0 * rn0 + iI1 * rn1 * rn1;
        const mn = kn == 0 ? 0 : 1 / kn;
        const rt0 = -r0x * normx - r0y * normy;
        const rt1 = -r1x * normx - r1y * normy;
        const kt = im0 + im1 + iI0 * rt0 * rt0 + iI1 * rt1 * rt1;
        const mt = kt == 0 ? 0 : 1 / kt;
        const imp = (rr - qpl) * mn;
        const Px = normx * imp;
        const Py = normy * imp;
        const v0x = b0.v.x - r0y * b0.w;
        const v0y = b0.v.y + r0x * b0.w;
        const v1x = b1.v.x - r1y * b1.w;
        const v1y = b1.v.y + r1x * b1.w;
        const dvx = v1x - v0x;
        const dvy = v1y - v0y;
        const vn = dvx * normx + dvy * normy;
        const vt = dvx * normy - dvy * normx;
        const bounce = -mn * (vn * (1 + rest));
        const mf = fric * bounce;
        const slide = Math.max(-mf, Math.min(-mt * vt, mf));
        const vPx = normx * bounce + normy * slide;
        const vPy = normy * bounce - normx * slide;
        b0.p.x -= Px * im0;
        b0.p.y -= Py * im0;
        b0.v.x -= vPx * im0;
        b0.v.y -= vPy * im0;
        b0.r -= (r0x * Py - r0y * Px) * iI0;
        b0.w -= (r0x * vPy - r0y * vPx) * iI0;
        b1.p.x += Px * im1;
        b1.p.y += Py * im1;
        b1.v.x += vPx * im1;
        b1.v.y += vPy * im1;
        b1.r += (r1x * Py - r1y * Px) * iI1;
        b1.w += (r1x * vPy - r1y * vPx) * iI1;
      }
    }
  }
};



// Returns {p, q, i}, where p is on the line segment a-b, q is on c-d, at least
// one of p or q is an endpoint, and the line segment p-q is as short as
// possible. The i parameter is true if a-b and c-d intersect.
Phys.lineInt_ = function(a, b, c, d) {
  const bax = b.x - a.x;
  const bay = b.y - a.y;
  const cax = c.x - a.x;
  const cay = c.y - a.y;
  const dcx = d.x - c.x;
  const dcy = d.y - c.y;

  // Check for intersection.
  const k = bax * dcy - bay * dcx;
  var it = false;
  if (k != 0) {
    const u = (cax * dcy - cay * dcx) / k;
    if (u >= 0 && u <= 1) {
      const v = (cax * bay - cay * bax) / k;
      if (v >= 0 && v <= 1) {
        it = true;
      }
    }
  }

  // Find the projections of all the endpoints and pick the nearest one.
  const dcl = dcx * dcx + dcy * dcy;
  var ua = 0, ub = 0;
  if (dcl > 0) {
    const bcx = b.x - c.x;
    const bcy = b.y - c.y;
    ua = (cax * dcx + cay * dcy) / -dcl;
    ua = ua <= 0 ? 0 : ua >= 1 ? 1 : ua;
    ub = (bcx * dcx + bcy * dcy) / dcl;
    ub = ub <= 0 ? 0 : ub >= 1 ? 1 : ub;
  }
  const bal = bax * bax + bay * bay;
  var uc = 0, ud = 0;
  if (bal > 0) {
    const dax = d.x - a.x;
    const day = d.y - a.y;
    uc = (cax * bax + cay * bay) / bal;
    uc = uc <= 0 ? 0 : uc >= 1 ? 1 : uc;
    ud = (dax * bax + day * bay) / bal;
    ud = ud <= 0 ? 0 : ud >= 1 ? 1 : ud;
  }

  const npx = [a.x, b.x, a.x + bax * uc, a.x + bax * ud];
  const npy = [a.y, b.y, a.y + bay * uc, a.y + bay * ud];
  const nqx = [c.x + dcx * ua, c.x + dcx * ub, c.x, d.x];
  const nqy = [c.y + dcy * ua, c.y + dcy * ub, c.y, d.y];
  var mpx, mpy, mqx, mqy, mn, mr = Infinity;
  for (i = 0; i < npx.length; ++i) {
    const nrx = npx[i] - nqx[i];
    const nry = npy[i] - nqy[i];
    const nr = nrx * nrx + nry * nry;
    if (nr < mr) {
      mpx = npx[i];
      mpy = npy[i];
      mqx = nqx[i];
      mqy = nqy[i];
      mr = nr;
      mn = 1;
    } else if (nr == mr) {
      mpx += npx[i];
      mpy += npy[i];
      mqx += nqx[i];
      mqy += nqy[i];
      ++mn;
    }
  }

  return {p: {x: mpx / mn, y: mpy / mn}, q: {x: mqx / mn, y: mqy / mn}, i: it};
};



// Apply all the forces affecting a body.
Phys.prototype.force_ = function(b) {
  const fx = b.m == 0 ? 0 : (this.grav.x + b.f.x * b.im) * this.dt;
  const fy = b.m == 0 ? 0 : (this.grav.y + b.f.y * b.im) * this.dt;
  const tq = b.a * b.iI * this.dt;
  b.p.x += (b.v.x + 0.5 * fx) * this.dt;
  b.p.y += (b.v.y + 0.5 * fy) * this.dt;
  b.r += (b.w + 0.5 * tq) * this.dt;
  b.v.x += fx;
  b.v.y += fy;
  b.w += tq;
  b.f.x = 0;
  b.f.y = 0;
  b.a = 0;
  const dd = 1 + this.dt * (1 - b.d);
  const ee = 1 + this.dt * (1 - b.e);
  b.v.x /= dd;
  b.v.y /= dd;
  b.w /= ee;
};
