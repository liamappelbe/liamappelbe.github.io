function a = qEpsGreedyNet(Q, s, allAct, epsilon)
  if rand < epsilon
    a = allAct(randi(length(allAct)));
  else
    [q, a] = qMaxActNet(Q, s, allAct);
  end
end