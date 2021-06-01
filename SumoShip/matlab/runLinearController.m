function [t, p] = runLinearController(params, initial, target, epsilon)
  s = buildState([initial]);
  t = 0;
  p = [initial.p.x, initial.p.y];
  targetArray = shipToArray(target);
  err = shipToArray(s.ships(1)) - targetArray;
  while mean(err .^ 2) > epsilon
    if ~s.ships(1).alive
      t = inf;
      return
    end
    t = t + 1;
    s = physics(s, getCmd(shipToArray(s.ships(1)), targetArray, params));
    p(size(p, 1) + 1, :) = [s.ships(1).p.x, s.ships(1).p.y];
    err = shipToArray(s.ships(1)) - targetArray;
  end
end