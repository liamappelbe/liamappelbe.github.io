classdef Buf < handle
  properties
    n = 10;
    i = 1;
    in = [];
    out = [];
  end

  methods
    function obj = Buf(numElements)
      obj.n = numElements;
      obj.i = 1;
      obj.in = [];
      obj.out = [];
    end

    function add(obj, newIn, newOut)
      obj.in(obj.i, :) = newIn;
      obj.out(obj.i, :) = newOut;
      obj.i = obj.i + 1;
      if obj.i > obj.n
        obj.i = 1;
      end
    end
  end
end