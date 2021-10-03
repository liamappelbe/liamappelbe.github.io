// 1D noise, similar to perlin, but lerped instead of cubic interpolated. The
// values that it returns are roughly in the range [0, 1], but may exceed this
// range slightly (with exponentially decreasing probability).
class LerpNoise {
  constructor(octaves, left = null, roughness = 0.5) {
    this.layers = [];
    let n = 1;
    let z = 1;
    for (let i = 0; i < octaves; ++i) {
      const l = [];
      for (let j = 0; j <= n; ++j) {
        if (j == 0 && left != null) {
          const ll = left.layers[i];
          l.push(ll[ll.length - 1]);
        } else {
          l.push(randf(1, -1) * z);
        }
      }
      n *= 2;
      z *= roughness;
      this.layers.push(l);
    }
  }

  get(x) {
    let y = 0, m = 1;
    for (const l of this.layers) {
      const v = x * m;
      const u = Math.floor(v);
      const t = v - u;
      y += u < 0 ? l[0] : u >= m ? l[m] : lerp(l[u], l[u + 1], t);
      m *= 2;
    }
    return (y + 1) / 2;
  }
}
