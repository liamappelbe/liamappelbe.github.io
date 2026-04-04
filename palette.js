const TAU = 2 * Math.PI;
function addColorPalette(colors) { addPalette(colors.map((c) => c.rgb)); }

/**
 * Hook for generating random palettes.
 * @param {number} colorCount The number of colors requested (2-10).
 */
function onGenerate(colorCount) {
  const algorithms = [
    [1, generateWalk],
    [1, generateSphere],
    // [1, generateCircleLC],
    // [1, generateCircleLH],
    // [1, generateCircleCH],
    [1, generateGradAll],
    [1, generateGradLC],
    [1, generateGradLH],
    [1, generateGradCH],
    [1, generateHGradLH],
    [1, generateHGradCH],
    [1, generateHFGradLH],
    [1, generateHFGradCH],
  ];

  for (const [n, f] of algorithms) {
    for (let i = 0; i < n; ++i) {
      addColorPalette(f(colorCount));
    }
  }
}

function generateSphere(n) {
  const c = Color.random();
  const pal = [c];
  for (const [l, a, b] of pointsOnSphere(n - 1)) {
    pal.push(c.mulAdd(new Color(l, a, b), 0.12).clamp);
  }
  return pal;
}

function pointsOnSphere(n) {
  const rand = () => 2 * Math.random() - 1;
  const len = (a) => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm = (a) => mul(a, 1 / len(a));
  const force = (a) => mul(a, Math.pow(len(a), -3));
  const points = [];
  const nudge = [];
  for (let i = 0; i < n; ++i) {
    points.push(norm([rand(), rand(), rand()]));
    nudge.push([0, 0, 0]);
  }
  for (let loop = 0; loop < 100; ++loop) {
    for (let i = 0; i < n; ++i) {
      nudge[i] = [0, 0, 0];
      for (let j = 0; j < n; ++j) {
        if (i == j) continue;
        nudge[i] = add(nudge[i], force(sub(points[i], points[j])));
      }
      nudge[i] = mul(nudge[i], 1);
    }
    for (let i = 0; i < n; ++i) {
      points[i] = norm(add(points[i], nudge[i]));
    }
  }
  return points;
}

function generateCircle(n, xy2lch) {
  const c = Color.random();
  const t0 = TAU * Math.random();
  const pal = [];
  const kRadius = 0.12;
  for (let i = 0; i < n; ++i) {
    const t = t0 + (i / n) * TAU;
    const [dl, dc, dh] = xy2lch(kRadius * Math.cos(t), kRadius * Math.sin(t));
    pal.push(Color.fromLch(c.l + dl, c.chroma + dc, c.hue + dh).clamp);
  }
  return pal;
}

function generateCircleLC(n) { return generateCircle(n, (x, y) => [x, y, 0]); }
function generateCircleLH(n) { return generateCircle(n, (x, y) => [x, 0, y]); }
function generateCircleCH(n) { return generateCircle(n, (x, y) => [0, x, y]); }


function generateGrad(n, f, mix) {
  for (let loop = 0; loop < 100; ++loop) {
    const c0 = Color.random();
    const c1_ = Color.random();
    f(c0, c1_);
    const c1 = c1_.clamp;
    if (c0.dist2(c1) < 0.05) continue;
    const pal = [];
    for (let i = 0; i < n; ++i) {
      pal.push(mix(c0, c1, i / (n - 1.0)));
    }
    return pal;
  }
}

function generateGradAll(n) {
  return generateGrad(n, (c0, c1) => {}, Color.mix);
}

function generateGradLC(n) {
  return generateGrad(n, (c0, c1) => {
    c1.hue = c0.hue;
  }, Color.mix);
}

function generateGradLH(n) {
  return generateGrad(n, (c0, c1) => {
    c1.chroma = c0.chroma;
  }, Color.mix);
}

function generateGradCH(n) {
  return generateGrad(n, (c0, c1) => {
    c1.l = c0.l;
  }, Color.mix);
}

function generateHGradLH(n) {
  return generateGrad(n, (c0, c1) => {
    c1.chroma = c0.chroma;
  }, Color.hmix);
}

function generateHGradCH(n) {
  return generateGrad(n, (c0, c1) => {
    c1.l = c0.l;
  }, Color.hmix);
}

function generateHFGradLH(n) {
  return generateGrad(n, (c0, c1) => {
    c1.chroma = c0.chroma;
  }, (c0, c1, k) => Color.hmix(c0, c1, k, rotFar));
}

function generateHFGradCH(n) {
  return generateGrad(n, (c0, c1) => {
    c1.l = c0.l;
  }, (c0, c1, k) => Color.hmix(c0, c1, k, rotFar));
}

function generateWalk(n) {
  while (true) {
    let c = Color.random();
    const pal = [c];
    const kStep = 0.15;
    const kValidDist = kStep * kStep * 0.5;
    const isValid = (d) => {
      for (const e of pal) {
        if (d.dist2(e) < kValidDist) return false;
      }
      return true;
    };
    const randStep = () => kStep * (2 * Math.random() - 1);
    for (let i = 1; i < n; ++i) {
      let ok = true;
      for (let loop = 0;; ++loop) {
        const d =
            (new Color(c.l + randStep(), c.a + randStep(), c.b + randStep()))
                .clamp;
        if (isValid(d)) {
          pal.push(d);
          break;
        }
        if (loop == 100) {
          ok = false;
          break;
        }
      }
      if (!ok) break;
    }
    if (pal.length == n) return pal;
  }
}

/**
 * Hook for extracting a palette from an image.
 * @param {Array<Array<number>>} pixels Array of [r, g, b] triples (0-1).
 * @param {number} width Image width.
 * @param {number} height Image height.
 * @param {number} colorCount The number of colors requested (2-10).
 */
function onImage(pixels, width, height, colorCount) {
  const pp = pixels.map(Color.fromRgbArray);
  const pal = generatePalette(pp, width, height, colorCount);
  addColorPalette(pal);
}

class Color {
  constructor(l, a, b) {
    this.l = l;
    this.a = a;
    this.b = b;
  }

  get rgb() {
    const linear2srgb = (x) =>
        fclamp(x <= .0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - .055);

    const L = this.l;
    const a = this.a;
    const b = this.b;

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    return [
      linear2srgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      linear2srgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      linear2srgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
    ];
  }

  static fromRgb(r, g, b) {
    const srgb2linear = (x) =>
        x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);

    r = srgb2linear(r);
    g = srgb2linear(g);
    b = srgb2linear(b);

    const l3 = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const l = Math.cbrt(l3);
    const m3 = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const m = Math.cbrt(m3);
    const s3 = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    const s = Math.cbrt(s3);

    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const a_ = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const b_ = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

    return new Color(L, a_, b_);
  }

  static fromLch(l, c, h) {
    return new Color(l, c * Math.cos(h), c * Math.sin(h));
  }

  get chroma() { return Math.sqrt(this.a * this.a + this.b * this.b); }
  get hue() { return Math.atan2(this.b, this.a); }

  set chroma(newChroma) {
    const s = newChroma / this.chroma;
    this.a *= s;
    this.b *= s;
  }

  set hue(newHue) {
    const c = this.chroma;
    this.a = c * Math.cos(newHue);
    this.b = c * Math.sin(newHue);
  }

  get clamp() { return Color.fromRgbArray(this.rgb); }

  static fromRgbArray(rgb) {
    const [r, g, b] = rgb;
    return Color.fromRgb(r, g, b);
  }

  static random() {
    const unhue = (h, c, m) => {
      const x = c * (1 - Math.abs(fmod(h, 2) - 1)) + m;
      c += m;
      if (h < 1) return [c, x, m];
      if (h < 2) return [x, c, m];
      if (h < 3) return [m, c, x];
      if (h < 4) return [m, x, c];
      if (h < 5) return [x, m, c];
      return [c, m, x];
    };

    const hsl2Rgb = (h, s, l) => {
      const c = s * (1 - Math.abs(2 * l - 1));
      return unhue(h * 6.0, c, l - c / 2);
    };

    const lk = 0.3;
    const squishl = (x) => (4 * Math.pow(x - 0.5, 3) + 0.5) * lk + (1 - lk) * x;

    return Color.fromRgbArray(
        hsl2Rgb(Math.random(), Math.random(), squishl(Math.random())));
  }

  diff(c) { return new Color((this.l - c.l), (this.a - c.a), (this.b - c.b)); }

  dist2(c) {
    const e = this.diff(c);
    return e.l * e.l + e.a * e.a + e.b * e.b;
  }


  mulAdd(c, k) {
    return new Color(this.l + k * c.l, this.a + k * c.a, this.b + k * c.b);
  }

  add(c) { return new Color(this.l + c.l, this.a + c.a, this.b + c.b); }
  mul(k) { return new Color(k * this.l, k * this.a, k * this.b); }
  emul(c) { return new Color(this.l * c.l, this.a * c.a, this.b * c.b); }

  static mix(c0, c1, k) {
    const k_ = 1 - k;
    return new Color(
        k_ * c0.l + c1.l * k, k_ * c0.a + c1.a * k, k_ * c0.b + c1.b * k);
  }

  static hmix(c0, c1, k, rot = rotNear) {
    const k_ = 1 - k;
    const cc0 = c0.chroma;
    const cc1 = c1.chroma;
    const ch0 = c0.hue;
    const ch1 = rot(c1.hue, ch0);
    return Color.fromLch(
        k_ * c0.l + c1.l * k, k_ * cc0 + cc1 * k, k_ * ch0 + ch1 * k);
  }

  /*addScalar(k) { return new Color(this.l + k, this.a + k, this.b + k); }

  min(c) {
    return new Color(
        Math.min(this.l, c.l), Math.min(this.a, c.a), Math.min(this.b, c.b));
  }

  max(c) {
    return new Color(
        Math.max(this.l, c.l), Math.max(this.a, c.a), Math.max(this.b, c.b));
  }*/
}

function fclamp(x, lo, hi) { return x <= lo ? lo : x >= hi ? hi : x; }

function fmod(x, y = 1) {
  const z = x / y;
  return (z - Math.floor(z)) * y;
}

function rotNear(angle, target) {
  const angle2 = target < angle ? angle - TAU : angle + TAU;
  return Math.abs(angle2 - target) < Math.abs(angle - target) ? angle2 : angle;
}

function rotFar(angle, target) {
  const angle2 = target < angle ? angle - TAU : angle + TAU;
  return Math.abs(angle2 - target) > Math.abs(angle - target) ? angle2 : angle;
}

function nearest(c, p) {
  let mk = 0;
  let md2 = 0;
  for (let k = 0; k < p.length; ++k) {
    const d2 = c.dist2(p[k]);
    if (k == 0 || d2 < md2) {
      mk = k;
      md2 = d2;
    }
  }
  return mk;
}

function generatePaletteInitialGuess(pixels, w, h, n) {
  // As a first approximation, we're going to cut the image up into n chunks
  // and take the average of each chunk as one of the palette colors.
  const bukn = [];
  const buckets = [];
  for (let k = 0; k < n; ++k) {
    buckets[k] = new Color(0, 0, 0);
    bukn[k] = 0;
  }

  // Divide the image into n roughly square chunks. Cut the image into rows.
  // Divide the rows into 2 groups, upper and lower. The upper group of
  // rowshas denseCol columns, and there are denseRows of them. The lower
  // group of rows has sparseCol columns, and there are sparseRows of them.
  const rows = Math.round(Math.sqrt(n));
  const sparseCols = Math.floor(n / rows);
  const denseCols = sparseCols + 1;
  const sparseRows = rows * denseCols - n;
  const denseRows = rows - sparseRows;
  const sparseOffset = denseRows * denseCols;
  const cellArea = w * h / n;
  const sparseColWidth = w / sparseCols;
  const sparseRowHeight = cellArea / sparseColWidth;
  const denseColWidth = w / denseCols;
  const denseRowHeight = cellArea / denseColWidth;
  const boundary = denseRowHeight * denseRows;

  for (let j = 0; j < h; ++j) {
    for (let i = 0; i < w; ++i) {
      let k = null;
      if (j < boundary) {
        const r = fclamp(Math.floor(j / denseRowHeight), 0, denseRows - 1);
        const c = fclamp(Math.floor(i * denseCols / w), 0, denseCols - 1);
        k = c + denseCols * r;
      } else {
        const r = fclamp(
            Math.floor((j - boundary) / sparseRowHeight), 0, sparseRows - 1);
        const c = fclamp(Math.floor(i * sparseCols / w), 0, sparseCols - 1);
        k = sparseOffset + c + sparseCols * r;
      }
      bukn[k] += 1;
      buckets[k] = buckets[k].add(pixels[j * w + i]);
    }
  }

  for (let k = 0; k < n; ++k) {
    // Take the average of the chunk, and add a tiny amount of noise, just in
    // case two buckets are identical (very unlikely).
    const rand = new Color(
        Math.random() * 1e-9, Math.random() * 1e-9, Math.random() * 1e-9);
    buckets[k] = rand.mulAdd(buckets[k], 1 / bukn[k]);
  }

  return buckets;
}

function generatePalette(pixels, w, h, n) {
  const pal = generatePaletteInitialGuess(pixels, w, h, n);

  // k-means optimisation. Iteratively improve the palette by gathering all
  // the pixels into their nearest bucket, then taking the average of that
  // bucket as the new palette color.
  const bukn = [];
  const buckets = [];
  let delta = 1e6;
  let loop = 0;
  while (delta > 1e-6 && loop < 100) {
    ++loop;
    for (let k = 0; k < n; ++k) {
      buckets[k] = new Color(0, 0, 0);
      bukn[k] = 0;
    }

    for (let j = 0; j < h; ++j) {
      for (let i = 0; i < w; ++i) {
        const c = pixels[j * w + i];
        const k = nearest(c, pal);
        const u = Math.pow(c.chroma, 5) * Math.pow(c.l, 2);
        bukn[k] += u;
        buckets[k] = buckets[k].add(c.mul(u));
      }
    }

    delta = 0;
    for (let k = 0; k < n; ++k) {
      let newp = null;
      if (bukn[k] == 0) {
        newp = new Color(Math.random(), Math.random(), Math.random());
      } else {
        newp = buckets[k].mul(1 / bukn[k]);
      }
      delta += pal[k].dist2(newp);
      pal[k] = newp;
    }
    delta /= n;
  }

  return pal;
}

(function() {
const kTestColors = [
  [[0, 0, 0], [0, 0, 0]],
  [[255, 255, 255], [1, 0, 0]],
  [[128, 128, 128], [0.5999, 0, 0]],
  [[255, 0, 0], [0.628, 0.2577, 29.23]],
  [[0, 255, 0], [0.8664, 0.294827, 142.4953]],
  [[0, 0, 255], [0.452, 0.313214, 264.052]],
  [[255, 255, 0], [0.968, 0.211, 109.77]],
  [[255, 0, 255], [0.7017, 0.3225, 328.36]],
  [[0, 255, 255], [0.9054, 0.15455, 194.769]],
  [[237, 11, 50], [0.5991, 0.2387, 23.29]],
  [[109, 77, 69], [0.4526, 0.0457, 34.53]],
  [[166, 165, 74], [0.704, 0.114, 108.42]],
  [[64, 124, 190], [0.577, 0.1199, 252.53]],
  [[140, 65, 243], [0.5704, 0.2469, 296.95]],
  [[145, 143, 88], [0.6385, 0.0753, 106.55]],
  [[221, 197, 66], [0.8209, 0.1475, 98.61]],
  [[63, 89, 194], [0.5039, 0.1667, 269.13]],
  [[70, 161, 11], [0.6283, 0.1891, 137.58]],
  [[60, 196, 246], [0.7696, 0.1331, 227.59]],
];

for (let [[r, g, b], [l, c, h]] of kTestColors) {
  r /= 255.0;
  g /= 255.0;
  b /= 255.0;
  h *= Math.PI / 180;
  const a_ = c * Math.cos(h);
  const b_ = c * Math.sin(h);
  const cc = new Color(l, a_, b_);
  {
    const [_r, _g, _b] = cc.rgb;
    const d = Math.abs(r - _r) + Math.abs(g - _g) + Math.abs(b - _b);
    console.assert(d < 1e-3, [r, g, b], [l, c, h]);
  }
  {
    const dd = Color.fromRgb(r, g, b);
    if (dd.h < 0) dd.h += TAU;
    if (dd.c < 1e-6) dd.h = 0;
    const d = cc.dist2(dd);
    console.assert(d < 1e-3, cc, dd, [r, g, b], [l, c, h]);
  }
}
})();
