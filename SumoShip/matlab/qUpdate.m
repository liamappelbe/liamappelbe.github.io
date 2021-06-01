function Q = qUpdate(Q, p, a, r, s, allAct, learnRate, discountFactor)
  Q(p, a) = (1 - learnRate) * Q(p, a) + learnRate * ( ...
    r + discountFactor * max(Q(s, allAct)));
end