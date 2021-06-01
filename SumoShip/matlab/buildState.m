function s = buildState(ships)
  s.ships = ships;
  s.body = [
    buildLine(-0.4, 0, 0.4, 0, 0.1),
    buildLine(-0.4, -0.2, -0.4, 0.2, 0.1),
    buildLine(0.4, -0.2, 0.4, 0.2, 0.1),
  ];
  s.physics.fieldSize.x = 6;
  s.physics.fieldSize.y = 3.6;
  s.physics.grav.x = 0;
  s.physics.grav.y = -1;
  s.physics.dt = 0.01;
  s.physics.mass = 1;
  s.physics.momin = 0.1;
  s.physics.corest = 0.2;
  s.physics.rocketL.x = -0.3;
  s.physics.rocketL.y = -0.1;
  s.physics.rocketR.x = 0.3;
  s.physics.rocketR.y = -0.1;
  s.physics.thrust = 2;
end

function l = buildLine(ax, ay, bx, by, r)
  l.a.x = ax;
  l.a.y = ay;
  l.b.x = bx;
  l.b.y = by;
  l.r = r;
end