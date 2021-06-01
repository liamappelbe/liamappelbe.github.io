function a = qEpsGreedy(Q, s, allAct, epsilon)
  if rand < epsilon
    a = allAct(randi(length(allAct)));
  else
    [x, i] = max(Q(s, allAct));
    a = allAct(i);
  end
end