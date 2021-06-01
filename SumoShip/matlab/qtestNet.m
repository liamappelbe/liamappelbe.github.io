Q = feedforwardnet([30, 30, 30, 30]);

% Randomise the weights.
X = [mod(0 : 80, 9) + 1; floor(1 : 1 / 9.0 : 9.99)];
Y = 0.001 * rand(1, size(X, 2)); % X(1, :) > X(2, :)
Q = train(Q, X, Y);
%Q = train(Q, [0; 0], [0]);

A = [4, 2, 0; 1, 3, 0; 2, 6, 0; 1, 0, 0; 6, 0, 0; 3, 5, 9; 1, 0, 0; 7, 9, 0; 6, 8, 0];
getAct = @(s) stripZeros(A(s, :));

ep = [0];
s = 1;
S = [1];
for i = 1 : 1000000
  i
  ep(length(ep)) = ep(length(ep)) + 1;
  a = qEpsGreedyNet(Q, s, getAct(s), 0.1);
  p = s;
  s = a;
  S(length(S) + 1) = s;
  r = -1;
  if s == 7
    r = 10000;
  end
  if r > 0
    ep(length(ep) + 1) = 0;
  end
  Q = qUpdateNet(Q, p, a, r, s, getAct(s), 0.01, 0.99);
end
plot(ep);
