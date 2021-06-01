initCtrls = [-1.2000, -62.6667, -3.2502, -92.3333, 3.5739, 1.9896];
best = initCtrls;


shipStateShape = [3, 1.8, 1, 1, pi, 1];
numShipStates = 10;

N = 10000;
level = 1;
for i = 1 : N
  ships = (rand(numShipStates, size(shipStateShape, 2)) * 2 - 1) .* ...
    repmat(shipStateShape, 10, 1);
  ctrls = mutateCtrls(best, initCtrls, 0.1 / level);
  t = evalLinearControllers(ships, ctrls);
  [y, j] = min(t);
  if (j == 1)
    level = level + 1;
  end
  best = ctrls(j, :)
  fprintf('Gen %d\nLevel %d\nBest: %d\n', i, level, y);
end