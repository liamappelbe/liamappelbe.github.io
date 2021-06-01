function b = stripZeros(a)
  b = a;
  b(b == 0) = [];
end