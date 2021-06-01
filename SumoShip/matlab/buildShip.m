function ship = buildShip(px, py, vx, vy, r, w)
  ship.p.x = px; 
  ship.p.y = py; 
  ship.v.x = vx; 
  ship.v.y = vy;
  ship.r = r;
  ship.w = w;
  ship.alive = true;
end