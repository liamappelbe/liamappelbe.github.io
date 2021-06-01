Q = zeros(9, 9);

A = [4, 2, 0; 1, 3, 0; 2, 6, 0; 1, 0, 0; 6, 0, 0; 3, 5, 9; 1, 0, 0; 7, 9, 0; 6, 8, 0];
getAct = @(s) stripZeros(A(s, :));

ep = [0];
s = 1;
S = [1];
for i = 1 : 2000
  ep(length(ep)) = ep(length(ep)) + 1;
  a = qEpsGreedy(Q, s, getAct(s), 0.01);
  p = s;
  s = a;
  S(length(S) + 1) = s;
  r = -1;
  if s == 7
    r = 100;
  end
  if r > 0
    ep(length(ep) + 1) = 0;
  end
  Q = qUpdate(Q, p, a, r, s, getAct(s), 0.01, 0.9);
end
plot(ep);