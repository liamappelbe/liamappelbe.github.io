%{
net = feedforwardnet([30, 30, 30, 30]);
X = -10:0.1:10;
Y = sin(X);
net = train(net, X, Y);

Xt = -15:0.1:15;

hold off
plot(Xt, sin(Xt));
hold on
plot(Xt, net(Xt));

Xr = 20 * (rand(1, 100) - 0.5);
Yr = net(Xr);
Xa = [Xr, 13];
Ya = [Yr, sin(13)];
net2 = feedforwardnet([30, 30, 30, 30]);
net2 = train(net2, Xa, Ya);
plot(Xt, net2(Xt));
%}

net = feedforwardnet([30, 30, 30, 30]);
net = train(net, 20 * (rand(1, 3) - 0.5), 0.01 * rand(1, 3));
hold off
plot(-15:0.1:15, sin(-15:0.1:15));
%hold on
plot(-15:0.1:15, net(-15:0.1:15));
for n = 2:100
  X = 20 * (rand(1, min(n, 100)) - 0.5);
  Y = [sin(X(1)), net(X(2:length(X)))];
  net = train(net, X, Y);
  %net = train(net, num2cell(X), num2cell(Y));
  plot(-15:0.1:15, net(-15:0.1:15));
end
