// TODO:
//  - Playlist thumbnails (2x2, so need 4 copy buttons).
//  - Configurable dither direction.
//  - Configurable clamping limits.
//  - Tweakable colors.

let generateThumbnail_context = null;
function generateThumbnail(image, options, addNote) {
  const kRGB = 0;
  const kHSV = 1;
  const kHSL = 2;
  const kOklab = 3;
  const kSpaces = {
    rgb: kRGB,
    hsv: kHSV,
    hsl: kHSL,
    oklab: kOklab,
  };

  const size = options.size;
  const wide = options.wide ?? true;
  const invis = options.invis ?? false;
  const clamp = options.clamp ?? true;
  const dither = options.dither ?? 1;
  const space = kSpaces[options.space] ?? kOklab;
  const chanw = options.chanWeight ?? [1, 1, 1];
  const palSize = options.palSize ?? 0;
  const aspectRatio = options.aspectRatio ?? 1;

  let base;
  let h;
  let w;
  let tmul;
  if (size == 'small') {
    base = 3 * 12 + 5 /*F3*/;
    h = 32;
    w = wide ? 2 * h + 1 : h;
    tmul = wide ? 1 : 2;
  } else if (size == 'embed') {
    base = 2 * 12 + 10 /*A#2*/;
    h = 39;
    w = 75;
    tmul = 1;
  } else if (size == 'full') {
    base = 2 * 12 + 0 /*C2*/;
    h = 72;
    w = 72 * aspectRatio;
    tmul = wide ? 1 : 2;
  } else {
    base = 2 * 12 + 8 /*G#2*/;
    h = 50;
    w = wide ? 2 * h + 1 : h;
    tmul = wide ? 1 : 2;
  }
  const len = invis ? 0.000001 : tmul;

  function fclamp(x, lo, hi) {
    return x <= lo ? lo : x >= hi ? hi : x;
  }

  function fmod(x, y = 1) {
    const z = x / y;
    return (z - Math.floor(z)) * y;
  }

  function hexchan(x) {
    return fclamp(Math.floor(x * 0x100), 0, 0xFF);
  }

  const srgb2linear = (x) =>
      x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  const linear2srgb = (x) =>
      x <= .0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - .055

  // These depend on the color space.
  let clampMin = null;
  let clampMax = null;

  class Color {
    constructor(r, g, b, a) {
      this.r = r;
      this.g = g;
      this.b = b;
    }

    diff(c) {
      return new Color(
          (this.r - c.r) * chanw[0], (this.g - c.g) * chanw[1],
          (this.b - c.b) * chanw[2]);
    }

    dist2(c) {
      const e = this.diff(c);
      return e.r * e.r + e.g * e.g + e.b * e.b;
    }

    _val() {
      return Math.max(Math.max(this.r, this.g), this.b);
    }

    _chroma(val) {
      return val - Math.min(Math.min(this.r, this.g), this.b);
    }

    _hue(val, chroma) {
      if (chroma <= 0) return 0;
      if (val == this.b) return fmod((4 + ((this.r - this.g) / chroma)) / 6.0);
      if (val == this.g) return fmod((2 + ((this.b - this.r) / chroma)) / 6.0);
      return fmod(((this.g - this.b) / chroma) / 6.0);
    }

    _unhue(h, c, m) {
      const x = c * (1 - Math.abs(fmod(h, 2) - 1)) + m;
      c += m;
      if (h < 1) return new Color(c, x, m);
      if (h < 2) return new Color(x, c, m);
      if (h < 3) return new Color(m, c, x);
      if (h < 4) return new Color(m, x, c);
      if (h < 5) return new Color(x, m, c);
      return new Color(c, m, x);
    }

    get rgb2Hsv() {
      const v = this._val();
      const c = this._chroma(v);
      const h = this._hue(v, c);
      const s = v > 0 ? c / v : 0;
      return new Color(h, s, v);
    }

    get hsv2Rgb() {
      const h = fmod(this.r) * 6.0;
      const s = this.g;
      const v = this.b;
      const c = v * s;
      const m = v - c;
      return this._unhue(h, c, m);
    }

    get rgb2Hsl() {
      const v = this._val();
      const c = this._chroma(v);
      const l = v - c / 2.0;
      const h = this._hue(v, c);
      const s = l > 0 && l < 1 ? (v - l) / Math.min(l, 1 - l) : 0;
      return new Color(h, s, l);
    }

    get hsl2Rgb() {
      const h = fmod(this.r) * 6.0;
      const s = this.g;
      const l = this.b;
      const c = s * (1 - Math.abs(2 * l - 1));
      const m = l - c / 2;
      return this._unhue(h, c, m);
    }

    get rgb2Oklab() {
      const r = srgb2linear(this.r);
      const g = srgb2linear(this.g);
      const b = srgb2linear(this.b);

      const l3 = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
      const l = Math.cbrt(l3);
      const m3 = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
      const m = Math.cbrt(m3);
      const s3 = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
      const s = Math.cbrt(s3);

      return new Color(
          0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
      );
    }

    get oklab2Rgb() {
      const L = this.r;
      const a = this.g;
      const b = this.b;

      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

      const l = l_ * l_ * l_;
      const m = m_ * m_ * m_;
      const s = s_ * s_ * s_;

      return new Color(
          linear2srgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
          linear2srgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
          linear2srgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
      );
    }

    get u32() {
      return 0xFF000000 + (hexchan(this.r) << 16) + (hexchan(this.g) << 8) +
          hexchan(this.b);
    }

    get _vald() {
      return this.b;
    }

    _conical(d) {
      const t = 2 * Math.PI * this.r;
      const r = this.g * d;
      return new Color(r * Math.cos(t), r * Math.sin(t), this.b);
    }

    _unconical(d) {
      if (d == 0) return new Color(0, 0, this.b);
      return new Color(
          Math.atan2(this.g, this.r) / (2 * Math.PI),
          Math.sqrt(this.r * this.r + this.g * this.g) / d, this.b);
    }

    get rgb2Hsvc() {
      const c = this.rgb2Hsv;
      return c._conical(c._vald);
    }

    get hsvc2Rgb() {
      return this._unconical(this._vald).hsv2Rgb;
    }

    get _lumd() {
      return 2 * Math.min(this.b, 1 - this.b);
    }

    get rgb2Hslc() {
      const c = this.rgb2Hsl;
      return c._conical(c._lumd);
    }

    get hslc2Rgb() {
      return this._unconical(this._lumd).hsl2Rgb;
    }

    mulAdd(c, k) {
      return new Color(this.r + k * c.r, this.g + k * c.g, this.b + k * c.b);
    }

    add(c) {
      return new Color(this.r + c.r, this.g + c.g, this.b + c.b);
    }

    mul(k) {
      return new Color(k * this.r, k * this.g, k * this.b);
    }

    emul(c) {
      return new Color(this.r * c.r, this.g * c.g, this.b * c.b);
    }

    addScalar(k) {
      return new Color(this.r + k, this.g + k, this.b + k);
    }

    get clamp() {
      return new Color(
          fclamp(this.r, clampMin.r, clampMax.r),
          fclamp(this.g, clampMin.g, clampMax.g),
          fclamp(this.b, clampMin.b, clampMax.b));
    }

    min(c) {
      return new Color(
          Math.min(this.r, c.r), Math.min(this.g, c.g), Math.min(this.b, c.b));
    }

    max(c) {
      return new Color(
          Math.max(this.r, c.r), Math.max(this.g, c.g), Math.max(this.b, c.b));
    }

    get rgb2Space() {
      if (space == kHSV) return this.rgb2Hsvc;
      if (space == kHSL) return this.rgb2Hslc;
      if (space == kOklab) return this.rgb2Oklab;
      return this;
    }

    get space2Rgb() {
      if (space == kHSV) return this.hsvc2Rgb;
      if (space == kHSL) return this.hslc2Rgb;
      if (space == kOklab) return this.oklab2Rgb;
      return this;
    }
  }

  /*for (const [r, g, b, l, a, b_] of [
           [7, 35, 242, 0.45401, -0.02670, -0.28646],
           [186, 26, 118, 0.52689, 0.20198, -0.02673],
           [244, 51, 37, 0.62841, 0.19926, 0.11234],
           [183, 152, 1, 0.68762, -0.01054, 0.14045],
           [98, 234, 121, 0.83606, -0.16279, 0.10628],
           [40, 159, 129, 0.63093, -0.11075, 0.01646],
           [6, 61, 96, 0.34655, -0.03569, -0.07229],
           [11, 2, 29, 0.13398, 0.02635, -0.05427],
           [35, 34, 37, 0.25426, 0.00297, -0.00492],
           [188, 187, 191, 0.79407, 0.00264, -0.00502],
           [109, 109, 111, 0.53542, 0.00086, -0.00295],
           [244, 242, 247, 0.96410, 0.00391, -0.00574]]) {
    const c = new Color(r / 255.0, g / 255.0, b / 255.0);
    const o = new Color(l, a, b_);
    const oact = c.rgb2Oklab;
    const cact = o.oklab2Rgb;
    const e = Math.sqrt(o.dist2(oact));
    if (e > 0.001) {
      console.log(c, o, oact);
    }
    const e2 = Math.sqrt(c.dist2(cact));
    if (e2 > 0.001) {
      console.log(c, o, cact);
    }
  }

  for (let i = 0; i < 100; ++i) {
    const c = new Color(Math.random(), Math.random(), Math.random());
    const o = c.rgb2Oklab;
    const d = o.oklab2Rgb;
    const e = Math.sqrt(c.dist2(d));
    if (e > 0.001) {
      console.log(c, o, d, e);
    }
  }*/

  function hexColor(red, green, blue) {
    return (new Color(red / 0xFF, green / 0xFF, blue / 0xFF)).rgb2Space;
  }

  if (generateThumbnail_context == null) {
    const view = document.createElement('canvas');
    const buf = view.getContext('2d');
    generateThumbnail_context = {view: view, buf: buf};
  }
  const view = generateThumbnail_context.view;
  const buf = generateThumbnail_context.buf;
  view.width = w;
  view.height = h;

  buf.fillStyle = 'black';
  buf.rect(0, 0, w, h);
  buf.fill();
  buf.drawImage(image, 0, 0, w, h);
  const imgData = buf.getImageData(0, 0, w, h);
  const a = [];
  for (let i = 0; i < imgData.data.length; i += 4) {
    a.push(hexColor(imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]));
  }

  function pixIndex(w, h, i, j) {
    return j * w + i;
  }

  function ditherPixel(a, w, h, i, j, e, x, clamp) {
    if (i >= 0 && i < w && j >= 0 && j < h) {
      const k = pixIndex(w, h, i, j);
      const c = a[k].mulAdd(e, x);
      a[k] = clamp ? c.clamp : c;
    }
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

  function generatePaletteInitialGuess(n) {
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
        buckets[k] = buckets[k].add(a[pixIndex(w, h, i, j)]);
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

  function generatePalette(n) {
    const pal = generatePaletteInitialGuess(n);

    // k-means optimisation. Iteratively improve the palette by gathering all
    // the pixels into their nearest bucket, then taking the average of that
    // bucket as the new palette color.
    const bukn = [];
    const buckets = [];
    const buckets2 = [];
    const buckets3 = [];
    let delta = 1e6;
    let loop = 0;
    while (delta > 1e-6 && loop < 100) {
      ++loop;
      for (let k = 0; k < n; ++k) {
        buckets[k] = new Color(0, 0, 0);
        buckets2[k] = new Color(0, 0, 0);
        buckets3[k] = new Color(0, 0, 0);
        bukn[k] = 0;
      }

      for (const c of a) {
        const k = nearest(c, pal);
        bukn[k] += 1;
        buckets[k] = buckets[k].add(c);
        const c2 = c.emul(c);
        buckets2[k] = buckets2[k].add(c2);
        buckets3[k] = buckets3[k].add(c2.emul(c));
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

  const kColors = palSize > 0 ? generatePalette(palSize) : [
    hexColor(0x03, 0xA9, 0xF4), hexColor(0xFF, 0x98, 0x00),
    hexColor(0xB7, 0x1C, 0x1C), hexColor(0xE9, 0x1E, 0x63),
    hexColor(0x4C, 0xAF, 0x50), hexColor(0x21, 0x21, 0x21),
    hexColor(0x3F, 0x51, 0xB5), hexColor(0xCD, 0xDC, 0x39),
    hexColor(0x15, 0x65, 0xC0), hexColor(0x82, 0x77, 0x17),
    hexColor(0xFF, 0xEA, 0x00), hexColor(0x8D, 0x6E, 0x63),
    hexColor(0x4E, 0x34, 0x2E), hexColor(0xFF, 0x63, 0x63),
    hexColor(0x75, 0xFF, 0x63), hexColor(0x63, 0xE0, 0xFF),
    hexColor(0xFD, 0x63, 0xFF), hexColor(0xFF, 0x57, 0x22),
    hexColor(0x1B, 0x5E, 0x20), hexColor(0xF4, 0x43, 0x36),
    hexColor(0xFF, 0xE0, 0xB2), hexColor(0x75, 0x75, 0x75),
    hexColor(0xE0, 0xAD, 0x00), hexColor(0xE9, 0xF9, 0xBD),
    hexColor(0xA8, 0xC8, 0x53), hexColor(0x0D, 0x47, 0xA1),
    hexColor(0x1D, 0x9D, 0x9D), hexColor(0x1E, 0xC5, 0x7A),
    hexColor(0x15, 0x21, 0x4F), hexColor(0x05, 0x10, 0x2F),
    hexColor(0x6C, 0xF3, 0xB7), hexColor(0xFF, 0x70, 0x70),
    hexColor(0xA1, 0xA6, 0x35), hexColor(0xEA, 0x79, 0x00),
    hexColor(0x55, 0xCA, 0xCA), hexColor(0x00, 0x80, 0x40),
    hexColor(0x7F, 0x0F, 0x48), hexColor(0x00, 0x00, 0x00),
    hexColor(0x00, 0x45, 0x1F), hexColor(0x9F, 0x0F, 0x22),
    hexColor(0x82, 0x05, 0x15), hexColor(0x15, 0x65, 0xC0),
    hexColor(0x98, 0x00, 0xFE), hexColor(0x03, 0xA9, 0xF4),
    hexColor(0x00, 0x45, 0x1F), hexColor(0x4E, 0x34, 0x2E),
    hexColor(0x8D, 0x6E, 0x63), hexColor(0x8E, 0x76, 0xFF),
    hexColor(0x21, 0x21, 0x21), hexColor(0xE0, 0xD3, 0x18),
    hexColor(0x82, 0x77, 0x17), hexColor(0xFF, 0xEA, 0x00),
    hexColor(0xE9, 0x1E, 0x63), hexColor(0x71, 0x00, 0xA6),
    hexColor(0x21, 0x21, 0x21), hexColor(0xFF, 0xFF, 0xFF),
    hexColor(0x1E, 0xC5, 0x7A), hexColor(0x6C, 0xF3, 0xB7),
  ];

  clampMin = new Color(Infinity, Infinity, Infinity);
  clampMax = new Color(-Infinity, -Infinity, -Infinity);
  for (let k = 0; k < kColors.length; ++k) {
    clampMin = clampMin.min(kColors[k]);
    clampMax = clampMax.max(kColors[k]);
  }

  const kNote =
      ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const b = [];
  for (let j = 0; j < h; ++j) {
    for (let i = 0; i < w; ++i) {
      const c = a[pixIndex(w, h, i, j)];
      const mk = nearest(c, kColors);
      const mc = kColors[mk];
      b.push(mc);
      const e = c.diff(mc);
      ditherPixel(a, w, h, i + 1, j, e, dither * 7 / 16.0, clamp)
      ditherPixel(a, w, h, i - 1, j + 1, e, dither * 3 / 16.0, clamp)
      ditherPixel(a, w, h, i, j + 1, e, dither * 5 / 16.0, clamp)
      ditherPixel(a, w, h, i + 1, j + 1, e, dither * 1 / 16.0, clamp)
      const n = h - 1 - j + base;
      addNote(kNote[n % 12] + Math.floor(n / 12), tmul * i, len, mk);
    }
  }
  outData = new Uint8ClampedArray(4 * b.length);
  for (let i = 0; i < b.length; ++i) {
    const c = b[i].space2Rgb;
    outData[4 * i + 0] = 0xFF * c.r;
    outData[4 * i + 1] = 0xFF * c.g;
    outData[4 * i + 2] = 0xFF * c.b;
    outData[4 * i + 3] = 0xFF;
  }
  const out = new ImageData(outData, w, h);
  buf.putImageData(out, 0, 0);

  let palette = null;
  if (palSize > 0) {
    palette = [];
    for (const c of kColors) {
      palette.push(c.space2Rgb);
    }
  }

  return [view, palette];
}
