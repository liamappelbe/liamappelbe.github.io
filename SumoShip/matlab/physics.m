%{
The physics function takes 2 arguments, state and cmd. The cmd is used to
update the state. The resulting state is returned (the input isn't modified).

% Game state.
state: {
  % State of each ship.
  ships: [{
    p: {x: 0.123, y: 0.123},  % Position.
    v: {x: 0.123, y: 0.123},  % Velocity.
    r: 0.123,  % Rotation, in range [-pi, pi).
    w: 0.123,  % Rotational velocity.
    alive: true,  % Whether the ship is alive.
  }, ...],

  % Ship body shape, shared between all ships. Represented as an array of fat
  % lines, each with a radius. So physically they are like rectangles with
  % semi-circles at the ends.
  body: [{
    a: {x: 0.123, y: 0.123},  % Endpoint of the line.
    b: {x: 0.123, y: 0.123},  % Endpoint of the line.
    r: 0.123,  % Radius of the line.
  }, ...],

  % Physical constants.
  physics: {
    fieldSize: {x: 0.123, y: 0.123},  % Size of the field.
    grav: {x: 0.123, y: 0.123},  % Gravitational acceleration.
    dt: 0.123,  % Physics time step per frame.
    mass: 0.123,  % Ship mass.
    momin: 0.123,  % Ship moment of inertia.
    corest: 0.123,  % Coefficient of restitution.
    rocketL: {x: 0.123, y: 0.123},  % Position of the left rocket.
    rocketR: {x: 0.123, y: 0.123},  % Position of the right rocket.
    thrust: 0.123,  % Total rocket thrust, as a multiple of gravity.
  },
}

% Last command received from each ai.
cmd: [{
  l: 0.123,  % Left rocket.
  r: 0.123,  % Right rocket.
}, ...]
%}
function s = physics(state, cmd)
  s = state;

  % Update ships.
  for i = 1 : length(s.ships)
    if s.ships(i).alive
      cmdl = cmd(i).l;
      if cmdl < 0
        cmdl = 0;
      elseif cmdl > 1
        cmdl = 1;
      end
      cmdr = cmd(i).r;
      if cmdr < 0
        cmdr = 0;
      elseif cmdr > 1
        cmdr = 1;
      end
      lf = s.physics.thrust * s.physics.mass * cmdl;
      rf = s.physics.thrust * s.physics.mass * cmdr;
      tq = (rf * s.physics.rocketR.x + lf * s.physics.rocketL.x) * ...
        s.physics.dt / s.physics.momin;
      rx = -sin(s.ships(i).r);
      ry = cos(s.ships(i).r);
      fx = (s.physics.grav.x + (rx * (lf + rf) / s.physics.mass)) * ...
        s.physics.dt;
      fy = (s.physics.grav.y + (ry * (lf + rf) / s.physics.mass)) * ...
        s.physics.dt;
      s.ships(i).p.x = s.ships(i).p.x + (s.ships(i).v.x + 0.5 * fx) * ...
        s.physics.dt;
      s.ships(i).p.y = s.ships(i).p.y + (s.ships(i).v.y + 0.5 * fy) * ...
        s.physics.dt;
      s.ships(i).v.x = s.ships(i).v.x + fx;
      s.ships(i).v.y = s.ships(i).v.y + fy;
      s.ships(i).r = s.ships(i).r + (s.ships(i).w + 0.5 * tq) * s.physics.dt;
      s.ships(i).r = physicsFixRot(s.ships(i).r);
      s.ships(i).w = s.ships(i).w + tq;

      if physicsIsOOB(s.ships(i), s.body, s.physics.fieldSize)
        s.ships(i).alive = false;
      end
    end
  end

  % Resolve collisions.
  for i = 2 : length(s.ships)
    if s.ships(i).alive
      for j = 1 : i - 1
        if s.ships(j).alive
          [s.ships(i), s.ships(j)] = physicsCollide( ...
            state, s.ships(i), s.ships(j));
        end
      end
    end
  end
end



% Create a vector.
function v = physicsVec(x, y)
  v.x = x;
  v.y = y;
end



% Modulo a rotation into the range [-pi, pi).
function r = physicsFixRot(r)
  r = mod(r + pi, 2 * pi) - pi;
end



% Transforms between the global and ship local coordinate systems.
function globalVec = physicsToGlobal(ship, localVec)
  rx = cos(ship.r);
  ry = sin(ship.r);
  globalVec = physicsVec( ...
    localVec.x * rx - localVec.y * ry + ship.p.x, ...
    localVec.x * ry + localVec.y * rx + ship.p.y);
end



% Returns whether the ship is out of bounds.
function isOOB = physicsIsOOB(ship, body, fieldSize)
  ex = fieldSize.x / 2;
  ey = fieldSize.y / 2;
  isOOB = true;
  for i = 1 : length(body)
    l = body(i);
    h = physicsLineInt(physicsVec(-ex, 0), physicsVec(ex, 0), ...
      physicsToGlobal(ship, l.a), physicsToGlobal(ship, l.b));
    v = physicsLineInt(physicsVec(0, -ey), physicsVec(0, ey), ...
      physicsToGlobal(ship, l.a), physicsToGlobal(ship, l.b));
    rrh = ey + l.r;
    rrv = ex + l.r;
    hpqx = h.p.x - h.q.x;
    hpqy = h.p.y - h.q.y;
    vpqx = v.p.x - v.q.x;
    vpqy = v.p.y - v.q.y;
    if (h.i || ((hpqx * hpqx + hpqy * hpqy) < (rrh * rrh))) && ...
        (v.i || ((vpqx * vpqx + vpqy * vpqy) < (rrv * rrv)))
      isOOB = false;
      return
    end
  end
end



% Returns {p, q, i}, where p is on the line segment a-b, q is on c-d, at least
% one of p or q is an endpoint, and the line segment p-q is as short as
% possible. The i parameter is true if a-b and c-d intersect.
function hit = physicsLineInt(a, b, c, d)
  bax = b.x - a.x;
  bay = b.y - a.y;
  cax = c.x - a.x;
  cay = c.y - a.y;
  dcx = d.x - c.x;
  dcy = d.y - c.y;

  % Check for intersection.
  k = bax * dcy - bay * dcx;
  it = false;
  if k ~= 0
    u = (cax * dcy - cay * dcx) / k;
    if u >= 0 && u <= 1
      v = (cax * bay - cay * bax) / k;
      if v >= 0 && v <= 1
        it = true;
      end
    end
  end

  % Find the projections of all the endpoints and pick the nearest one.
  dcl = dcx * dcx + dcy * dcy;
  ua = 0;
  ub = 0;
  if (dcl > 0)
    bcx = b.x - c.x;
    bcy = b.y - c.y;
    ua = (cax * dcx + cay * dcy) / -dcl;
    if ua < 0
      ua = 0;
    elseif ua > 1
      ua = 1;
    end
    ub = (bcx * dcx + bcy * dcy) / dcl;
    if ub < 0
      ub = 0;
    elseif ub > 1
      ub = 1;
    end
  end

  bal = bax * bax + bay * bay;
  uc = 0;
  ud = 0;
  if (bal > 0)
    dax = d.x - a.x;
    day = d.y - a.y;
    uc = (cax * bax + cay * bay) / bal;
    if uc < 0
      uc = 0;
    elseif uc > 1
      uc = 1;
    end
    ud = (dax * bax + day * bay) / bal;
    if ud < 0
      ud = 0;
    elseif ud > 1
      ud = 1;
    end
  end

  mpx = 0;
  mpy = 0;
  mqx = 0;
  mqy = 0;
  mn = 0;
  mr = inf;
  npx = [a.x, b.x, a.x + bax * uc, a.x + bax * ud];
  npy = [a.y, b.y, a.y + bay * uc, a.y + bay * ud];
  nqx = [c.x + dcx * ua, c.x + dcx * ub, c.x, d.x];
  nqy = [c.y + dcy * ua, c.y + dcy * ub, c.y, d.y];
  for i = 1 : length(npx)
    nrx = npx(i) - nqx(i);
    nry = npy(i) - nqy(i);
    nr = nrx * nrx + nry * nry;
    if nr < mr
      mpx = npx(i);
      mpy = npy(i);
      mqx = nqx(i);
      mqy = nqy(i);
      mr = nr;
      mn = 1;
    elseif nr == mr
      mpx = mpx + npx(i);
      mpy = mpy + npy(i);
      mqx = mqx + nqx(i);
      mqy = mqy + nqy(i);
      mn = mn + 1;
    end
  end

  hit.p = physicsVec(mpx / mn, mpy / mn);
  hit.q = physicsVec(mqx / mn, mqy / mn);
  hit.i = it;
end



% Resolve collisions betwen 2 ships.
function [s0, s1] = physicsCollide(state, s0, s1)
  for i0 = 1 : length(state.body)
    l0 = state.body(i0);
    for i1 = 1 : length(state.body)
      l1 = state.body(i1);
      h = physicsLineInt( ...
        physicsToGlobal(s0, l0.a), physicsToGlobal(s0, l0.b), ...
        physicsToGlobal(s1, l1.a), physicsToGlobal(s1, l1.b));
      rr = l0.r + l1.r;
      qpx = h.q.x - h.p.x;
      qpy = h.q.y - h.p.y;
      qpl = sqrt(qpx * qpx + qpy * qpy);

      if qpl > 0 && (h.i || qpl < rr)
        normx = qpx / qpl;
        normy = qpy / qpl;
        poix = (h.p.x + h.q.x + normx * (l0.r - l1.r)) * 0.5;
        poiy = (h.p.y + h.q.y + normy * (l0.r - l1.r)) * 0.5;
        r0x = poix - s0.p.x;
        r0y = poiy - s0.p.y;
        r1x = poix - s1.p.x;
        r1y = poiy - s1.p.y;
        rn0 = r0x * normy - r0y * normx;
        rn1 = r1x * normy - r1y * normx;
        normMass = 1 / ((2 / state.physics.mass) + ...
          ((rn0 * rn0 + rn1 * rn1) / state.physics.momin));
        imp = (rr - qpl) * normMass;
        Px = normx * imp;
        Py = normy * imp;
        v0x = s0.v.x - r0y * s0.w;
        v0y = s0.v.y + r0x * s0.w;
        v1x = s1.v.x - r1y * s1.w;
        v1y = s1.v.y + r1x * s1.w;
        dvx = v1x - v0x;
        dvy = v1y - v0y;
        vn = dvx * normx + dvy * normy;
        bounce = -normMass * (vn * (1 + state.physics.corest));
        vPx = normx * bounce;
        vPy = normy * bounce;
        Ipx = Px / state.physics.mass;
        Ipy = Py / state.physics.mass;
        Ir0 = (r0x * Py - r0y * Px) / state.physics.momin;
        Ir1 = (r1x * Py - r1y * Px) / state.physics.momin;
        Ivx = vPx / state.physics.mass;
        Ivy = vPy / state.physics.mass;
        Iw0 = (r0x * vPy - r0y * vPx) / state.physics.momin;
        Iw1 = (r1x * vPy - r1y * vPx) / state.physics.momin;
        s0.v.x = s0.v.x + Ivx;
        s0.v.y = s0.v.y + Ivy;
        s0.p.x = s0.p.x + Ipx;
        s0.p.y = s0.p.y + Ipy;
        s0.w = s0.w + Iw0;
        s0.r = s0.r + Ir0;
        s0.r = physicsFixRot(s0.r);
        s1.v.x = s1.v.x + Ivx;
        s1.v.y = s1.v.y + Ivy;
        s1.p.x = s1.p.x + Ipx;
        s1.p.y = s1.p.y + Ipy;
        s1.w = s1.w + Iw1;
        s1.r = s1.r + Ir1;
        s1.r = physicsFixRot(s1.r);
      end
    end
  end
end