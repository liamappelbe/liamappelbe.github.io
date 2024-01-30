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

  const small = options.small ?? false;
  const wide = options.wide ?? true;
  const invis = options.invis ?? false;
  const clamp = options.clamp ?? true;
  const dither = options.dither ?? 1;
  const space = kSpaces[options.space] ?? kOklab;
  const chanw = options.chanWeight ?? [1, 1, 1];
  const len = invis ? 0.000001 : wide ? 1 : 2;
  const base = small ? 3 * 12 + 5 /*F3*/ : 2 * 12 + 8 /*G#2*/;
  const h = small ? 32 : 50;
  const w = wide ? 2 * h + 1 : h;

  function fclamp(x, lo, hi) {
    return x <= lo ? lo : x >= hi ? hi : x;
  }

  function fmod(x, y = 1) {
    const z = x / y;
    return (z - Math.floor(z)) * y;
  }

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
      const r = this.r;
      const g = this.g;
      const b = this.b;

      const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
      const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
      const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

      const l_ = Math.cbrt(l);
      const m_ = Math.cbrt(m);
      const s_ = Math.cbrt(s);

      return new Color(
          0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
          1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
          0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
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
          +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
      );
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

  function hexColor(red, green, blue) {
    return (new Color(red / 0xFF, green / 0xFF, blue / 0xFF)).rgb2Space;
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

  const kColors = [
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

  function nearest(c) {
    let mk = 0;
    let md2 = 0;
    for (let k = 0; k < kColors.length; ++k) {
      const d2 = c.dist2(kColors[k]);
      if (k == 0 || d2 < md2) {
        mk = k;
        md2 = d2;
      }
    }
    return mk;
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

  buf.drawImage(image, 0, 0, w, h);
  const imgData = buf.getImageData(0, 0, w, h);
  const a = [];
  for (let i = 0; i < imgData.data.length; i += 4) {
    a.push(hexColor(imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]));
  }
  const b = [];
  for (let j = 0; j < h; ++j) {
    for (let i = 0; i < w; ++i) {
      const c = a[pixIndex(w, h, i, j)];
      const mk = nearest(c);
      const mc = kColors[mk];
      b.push(mc);
      const e = c.diff(mc);
      ditherPixel(a, w, h, i + 1, j, e, dither * 7 / 16.0, clamp)
      ditherPixel(a, w, h, i - 1, j + 1, e, dither * 3 / 16.0, clamp)
      ditherPixel(a, w, h, i, j + 1, e, dither * 5 / 16.0, clamp)
      ditherPixel(a, w, h, i + 1, j + 1, e, dither * 1 / 16.0, clamp)
      const n = h - 1 - j + base;
      addNote(kNote[n % 12] + Math.floor(n / 12), wide ? i : 2 * i, len, mk);
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
  return view;
}
