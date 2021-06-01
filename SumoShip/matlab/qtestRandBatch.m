transferFunc = @(p, a) [p, a] * [1, 0; 1, 1; 0, 1];
rewardFunc = @(p, a, s) 1000 * (1 - sum(s .^ 2));

Q = feedforwardnet([30]);
X = randBatch(1000, [10, 1], [0, 0], [1], [0], transferFunc, rewardFunc);
Y = X.r;
Q = train(Q, X.x', Y');
act = -1:0.1:1;

for i = 1 : 10000
  i
  X = randBatch(1000, [10, 1], [0, 0], [1], [0], transferFunc, rewardFunc);
  Q = qUpdateRandBatch(Q, X, act, 0.001, 0.999);
end

S = [4, 0.5];
while true
  p = S(size(S, 1), :);
  a = qEpsGreedyNet(Q, p, act, 0);
  S(size(S, 1) + 1, :) = transferFunc(p, a);
end
plot(S(:, 1), 1:size(S, 1));