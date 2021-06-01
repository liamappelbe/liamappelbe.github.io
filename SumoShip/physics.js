// A collection of static functions for handling the SumoShip physics.
Physics = {};



/*
The nextState function takes 2 arguments, state and cmd. The cmd is used to
update the state. The resulting state is returned (the input isn't modified).

// Game state.
state: {
  // State of each ship.
  ships: [{
    p: {x: 0.123, y: 0.123},  // Position.
    v: {x: 0.123, y: 0.123},  // Velocity.
    r: 0.123,  // Rotation, in range [-pi, pi).
    w: 0.123,  // Rotational velocity.
    alive: true,  // Whether the ship is alive.
  }, ...],

  // Ship body shape, shared between all ships. Represented as an array of fat
  // lines, each with a radius. So physically they are like rectangles with
  // semi-circles at the ends.
  body: [{
    a: {x: 0.123, y: 0.123},  // Endpoint of the line.
    b: {x: 0.123, y: 0.123},  // Endpoint of the line.
    r: 0.123,  // Radius of the line.
  }, ...],

  // Physical constants.
  physics: {
    fieldSize: {x: 0.123, y: 0.123},  // Size of the field.
    grav: {x: 0.123, y: 0.123},  // Gravitational acceleration.
    dt: 0.123,  // Physics time step per frame.
    mass: 0.123,  // Ship mass.
    momin: 0.123,  // Ship moment of inertia.
    corest: 0.123,  // Coefficient of restitution.
    rocketL: {x: 0.123, y: 0.123},  // Position of the left rocket.
    rocketR: {x: 0.123, y: 0.123},  // Position of the right rocket.
    thrust: 0.123,  // Total rocket thrust, as a multiple of gravity.
  },
}

// Last command received from each ai.
cmd: [{
  l: 0.123,  // Left rocket.
  r: 0.123,  // Right rocket.
}, ...]
*/
Physics.nextState = function(state, cmd) {
  var s = JSON.parse(JSON.stringify(state));

  // Update ships.
  for (var i = 0; i < s.ships.length; ++i) {
    var ship = s.ships[i];
    if (ship.alive) {
      var lf = s.physics.thrust * s.physics.mass * cmd[i].l;
      var rf = s.physics.thrust * s.physics.mass * cmd[i].r;
      var tq = rf * s.physics.rocketR.x + lf * s.physics.rocketL.x;
      tq *= s.physics.dt / s.physics.momin;
      var rx = -Math.sin(ship.r);
      var ry = Math.cos(ship.r);
      var fx = (s.physics.grav.x + (rx * (lf + rf) / s.physics.mass)) *
        s.physics.dt;
      var fy = (s.physics.grav.y + (ry * (lf + rf) / s.physics.mass)) *
        s.physics.dt;
      ship.p.x += (ship.v.x + 0.5 * fx) * s.physics.dt;
      ship.p.y += (ship.v.y + 0.5 * fy) * s.physics.dt;
      ship.v.x += fx;
      ship.v.y += fy;
      ship.r += (ship.w + 0.5 * tq) * s.physics.dt;
      ship.r = Physics.fixRot(ship.r);
      ship.w += tq;

      if (Physics.isOOB(ship, s.body, s.physics.fieldSize)) {
        ship.alive = false;
      }
    }
  }

  // Resolve collisions.
  for (var i = 1; i < s.ships.length; ++i) {
    if (s.ships[i].alive) {
      for (var j = 0; j < i; ++j) {
        if (s.ships[j].alive) {
          Physics.collide(state, s.ships[i], s.ships[j]);
        }
      }
    }
  }

  return s;
};



// Modulo a rotation into the range [-pi, pi).
Physics.fixRot = function(r) {
  return (r + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
};



// Transforms between the global and ship local coordinate systems.
Physics.toGlobal = function(ship, local) {
  var rx = Math.cos(ship.r), ry = Math.sin(ship.r);
  return {
    x: local.x * rx - local.y * ry + ship.p.x,
    y: local.x * ry + local.y * rx + ship.p.y,
  };
};



// Returns whether the ship is out of bounds.
Physics.isOOB = function(ship, body, fieldSize) {
  var ex = fieldSize.x / 2, ey = fieldSize.y / 2;
  for (var i = 0; i < body.length; ++i) {
    var l = body[i];
    var h = Physics.lineInt({x: -ex, y: 0}, {x: ex, y: 0},
      Physics.toGlobal(ship, l.a), Physics.toGlobal(ship, l.b));
    var v = Physics.lineInt({x: 0, y: -ey}, {x: 0, y: ey},
      Physics.toGlobal(ship, l.a), Physics.toGlobal(ship, l.b));
    var rrh = ey + l.r;
    rrh *= rrh;
    var rrv = ex + l.r;
    rrv *= rrv;
    var hpqx = h.p.x - h.q.x;
    var hpqy = h.p.y - h.q.y;
    var vpqx = v.p.x - v.q.x;
    var vpqy = v.p.y - v.q.y;
    if ((h.i || ((hpqx * hpqx + hpqy * hpqy) < rrh)) &&
        (v.i || ((vpqx * vpqx + vpqy * vpqy) < rrv))) {
      return false;
    }
  }
  return true;
};



// Returns {p, q, i}, where p is on the line segment a-b, q is on c-d, at least
// one of p or q is an endpoint, and the line segment p-q is as short as
// possible. The i parameter is true if a-b and c-d intersect.
Physics.lineInt = function(a, b, c, d) {
  var bax = b.x - a.x;
  var bay = b.y - a.y;
  var cax = c.x - a.x;
  var cay = c.y - a.y;
  var dcx = d.x - c.x;
  var dcy = d.y - c.y;

  // Check for intersection.
  var k = bax * dcy - bay * dcx;
  var it = false;
  if (k != 0) {
    var u = (cax * dcy - cay * dcx) / k;
    if (u >= 0 && u <= 1) {
      var v = (cax * bay - cay * bax) / k;
      if (v >= 0 && v <= 1) {
        it = true;
      }
    }
  }

  // Find the projections of all the endpoints and pick the nearest one.
  var dcl = dcx * dcx + dcy * dcy;
  var bal = bax * bax + bay * bay;
  var ua = 0, ub = 0;
  if (dcl > 0) {
    var bcx = b.x - c.x;
    var bcy = b.y - c.y;
    ua = (cax * dcx + cay * dcy) / -dcl;
    ua = ua <= 0 ? 0 : ua >= 1 ? 1 : ua;
    ub = (bcx * dcx + bcy * dcy) / dcl;
    ub = ub <= 0 ? 0 : ub >= 1 ? 1 : ub;
  }
  var uc = 0, ud = 0;
  if (bal > 0) {
    var dax = d.x - a.x;
    var day = d.y - a.y;
    uc = (cax * bax + cay * bay) / bal;
    uc = uc <= 0 ? 0 : uc >= 1 ? 1 : uc;
    ud = (dax * bax + day * bay) / bal;
    ud = ud <= 0 ? 0 : ud >= 1 ? 1 : ud;
  }

  var mpx, mpy, mqx, mqy, mn, mr = Infinity;
  var npx = [a.x, b.x, a.x + bax * uc, a.x + bax * ud];
  var npy = [a.y, b.y, a.y + bay * uc, a.y + bay * ud];
  var nqx = [c.x + dcx * ua, c.x + dcx * ub, c.x, d.x];
  var nqy = [c.y + dcy * ua, c.y + dcy * ub, c.y, d.y];
  for (i = 0; i < npx.length; ++i) {
    nrx = npx[i] - nqx[i];
    nry = npy[i] - nqy[i];
    var nr = nrx * nrx + nry * nry;
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



// Resolve collisions betwen 2 ships.
Physics.collide = function(state, s0, s1) {
  for (i0 = 0; i0 < state.body.length; ++i0) {
    var l0 = state.body[i0];
    for (i1 = 0; i1 < state.body.length; ++i1) {
      var l1 = state.body[i1];
      var h = Physics.lineInt(
        Physics.toGlobal(s0, l0.a), Physics.toGlobal(s0, l0.b),
        Physics.toGlobal(s1, l1.a), Physics.toGlobal(s1, l1.b));
      var rr = l0.r + l1.r;
      var qpx = h.q.x - h.p.x;
      var qpy = h.q.y - h.p.y;
      var qpl = Math.sqrt(qpx * qpx + qpy * qpy);

      if(qpl > 0 && (h.i || qpl < rr)) {
        var normx = qpx / qpl;
        var normy = qpy / qpl;
        var poix = (h.p.x + h.q.x + normx * (l0.r - l1.r)) * 0.5;
        var poiy = (h.p.y + h.q.y + normy * (l0.r - l1.r)) * 0.5;
        var r0x = poix - s0.p.x;
        var r0y = poiy - s0.p.y;
        var r1x = poix - s1.p.x;
        var r1y = poiy - s1.p.y;
        var rn0 = r0x * normy - r0y * normx;
        var rn1 = r1x * normy - r1y * normx;
        var normMass = 1 / ((2 / state.physics.mass) +
          ((rn0 * rn0 + rn1 * rn1) / state.physics.momin));
        var imp = (rr - qpl) * normMass;
        var Px = normx * imp;
        var Py = normy * imp;
        var v0x = s0.v.x - r0y * s0.w;
        var v0y = s0.v.y + r0x * s0.w;
        var v1x = s1.v.x - r1y * s1.w;
        var v1y = s1.v.y + r1x * s1.w;
        var dvx = v1x - v0x;
        var dvy = v1y - v0y;
        var vn = dvx * normx + dvy * normy;
        var bounce = -normMass * (vn * (1 + state.physics.corest));
        var vPx = normx * bounce;
        var vPy = normy * bounce;
        var Ipx = Px / state.physics.mass;
        var Ipy = Py / state.physics.mass;
        var Ir0 = (r0x * Py - r0y * Px) / state.physics.momin;
        var Ir1 = (r1x * Py - r1y * Px) / state.physics.momin;
        var Ivx = vPx / state.physics.mass;
        var Ivy = vPy / state.physics.mass;
        var Iw0 = (r0x * vPy - r0y * vPx) / state.physics.momin;
        var Iw1 = (r1x * vPy - r1y * vPx) / state.physics.momin;
        s0.v.x -= Ivx;
        s0.v.y -= Ivy;
        s0.p.x -= Ipx;
        s0.p.y -= Ipy;
        s0.w -= Iw0;
        s0.r -= Ir0;
        s0.r = Physics.fixRot(s0.r);
        s1.v.x += Ivx;
        s1.v.y += Ivy;
        s1.p.x += Ipx;
        s1.p.y += Ipy;
        s1.w += Iw1;
        s1.r += Ir1;
        s1.r = Physics.fixRot(s1.r);
      }
    }
  }
};