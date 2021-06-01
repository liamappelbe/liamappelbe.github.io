function ship = arrayToShip(array)
  ship.p.x = array(1);
  ship.p.y = array(2);
  ship.v.x = array(3);
  ship.v.y = array(4);
  ship.r = array(5);
  ship.w = array(6);
  ship.alive = true;
end