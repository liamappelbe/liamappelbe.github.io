function ctrls = mutateCtrls(c, d, epsilon)
%  N = 10;
%  ctrls = zeros(N, length(c));
%  for i = 1 : N
%    ctrls(i, :) = c + d .* (2 * rand(size(d)) - 1) * epsilon * (i - 1) / N;
%  end
  x = [zeros(size(c)); diag(ones(size(c))); diag(-1 * ones(size(c)))];
  cc = repmat(c, size(x, 1), 1);
  dd = repmat(d, size(x, 1), 1);
  ctrls = cc + epsilon * dd .* x;
end