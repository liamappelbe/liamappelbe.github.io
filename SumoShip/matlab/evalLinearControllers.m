function totalTimes = evalLinearControllers(ships, ctrls)
  expander = [1, 1, 1, 1, 1, 1; -1, 1, -1, 1, -1, -1];
  totalTimes = zeros(size(ctrls, 1), 1);
  for i = 1 : size(ships, 1)
    for j = 1 : size(ships, 1)
      tt = zeros(size(ctrls, 1), 1);
      anyNonInf = false;
      for k = 1 : size(ctrls, 1)
        c = expander;
        c(1, :) = c(1, :) .* ctrls(k, :);
        c(2, :) = c(2, :) .* ctrls(k, :);
        [t, p] = runLinearController( ...
          c, arrayToShip(ships(i, :)), arrayToShip(ships(j, :)), 1e-3);
        %fprintf('Steps: %d\n', t);
        %plot(p(:, 1), p(:, 2));
        tt(k) = t;
        if t < inf
          anyNonInf = true;
        end
      end
      if anyNonInf
        totalTimes = totalTimes + tt;
      end
    end
  end
end