function Q = qUpdateNet(Q, p, a, r, s, allAct, learnRate, discountFactor)
  q = (1 - learnRate) * Q([p; a]) + learnRate * ( ...
    r + discountFactor * qMaxActNet(Q, s, allAct));
  Q = adapt(Q, [p; a], q);
end