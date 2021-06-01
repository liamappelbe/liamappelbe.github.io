function [q, a] = qMaxActNet(Q, s, allAct)
  a = allAct(1);
  q = Q([s; a]);
  for i = 2 : length(allAct)
    aa = allAct(i);
    qq = Q([s; aa]);
    if qq > q
      q = qq;
      a = aa;
    end
  end
end