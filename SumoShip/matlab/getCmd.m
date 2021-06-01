function cmd = getCmd(s, t, p)
  e = s - t;
  cmd.l = sum(p(1, :) .* e);
  cmd.r = sum(p(2, :) .* e);
end