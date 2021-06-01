function Q = qUpdateRandBatch(Q, X, allAct, learnRate, discountFactor)
  q = zeros(1, length(X.p));
  for i = 1:length(X.p)
    q(i) = (1 - learnRate) * Q(X.x(i, :)') + learnRate * ( ...
      X.r(i, :) + discountFactor * qMaxActNet(Q, X.s(i, :)', allAct));
  end
  Q = adapt(Q, X.x', q);
end