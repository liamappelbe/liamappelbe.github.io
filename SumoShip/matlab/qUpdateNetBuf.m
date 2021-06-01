function Q = qUpdateNetBuf(Q, B, p, a, r, s, allAct, learnRate, discountFactor)
  q = (1 - learnRate) * Q([p; a]) + learnRate * ( ...
    r + discountFactor * qMaxActNet(Q, s, allAct));
  B.add([p; a], q);
  Q = train(Q, B.in', B.out');
end