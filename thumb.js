// TODO:
//  - Playlist thumbnails (2x2, so need 4 copy buttons).
//  - Configurable dither direction.
//  - Configurable clamping limits.
//  - Tweakable colors.

let generateThumbnail_context = null;
function generateThumbnail(image, options, addNote) {
  const kRGB = 0;
  const kHSV = 1;
  const kHSL = 1;
  const kSpaces = {
    rgb: kRGB,
    hsv: kHSV,
    hsl: kHSL,
  };

  const small = options.small ?? false;
  const wide = options.wide ?? true;
  const invis = options.invis ?? false;
  const clamp = options.clamp ?? true;
  const white = options.white ?? true;
  const dither = options.dither ?? 1;
  const space = kSpaces[options.space] ?? kRGB;
  const chanw = options.chanWeight ?? [1, 1, 1];
  const len = invis ? 0.000001 : wide ? 1 : 2;
  const base = small ? 3 * 12 + 5 /*F3*/ : 2 * 12 + 8 /*G#2*/;
  const h = small ? 32 : 50;
  const w = wide ? 2 * h + 1 : h;

  function fclamp(x) {
    return x <= 0 ? 0 : x >= 1 ? 1 : x;
  }

  function fmod(x, y = 1) {
    const z = x / y;
    return (z - Math.floor(z)) * y;
  }

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
      return new Color(fclamp(this.r), fclamp(this.g), fclamp(this.b));
    }

    min(c) {
      return new Color(
          Math.min(this.r, c.r), Math.min(this.g, c.g), Math.min(this.b, c.b));
    }

    get rgb2Space() {
      if (space == kHSV) return this.rgb2Hsvc;
      if (space == kHSL) return this.rgb2Hslc;
      return this;
    }

    get space2Rgb() {
      if (space == kHSV) return this.hsvc2Rgb;
      if (space == kHSL) return this.hslc2Rgb;
      return this;
    }
  }

  /*function testSpaces(
      r, g, b, h = null, sv = null, v = null, sl = null, l = null) {
    function fnear(x, y) {
      return Math.abs(x - y) < 1e-6;
    }
    function isNear(c0, c1) {
      return fnear(c0.r, c1.r) && fnear(c0.g, c1.g) && fnear(c0.b, c1.b);
    }
    if (h !== null) h /= 6.0;
    const rgb = new Color(r, g, b);
    const hsv = rgb.rgb2Hsv;
    console.assert(hsv.r >= 0 && hsv.r <= 1, rgb, hsv);
    console.assert(hsv.g >= 0 && hsv.g <= 1, rgb, hsv);
    console.assert(hsv.b >= 0 && hsv.b <= 1, rgb, hsv);
    if (h !== null) console.assert(fnear(h, hsv.r), rgb, hsv);
    if (sv !== null) console.assert(fnear(sv, hsv.g), rgb, hsv);
    if (v !== null) console.assert(fnear(v, hsv.b), rgb, hsv);
    const hsl = rgb.rgb2Hsl;
    console.assert(hsl.r >= 0 && hsl.r <= 1, rgb, hsl);
    console.assert(hsl.g >= 0 && hsl.g <= 1, rgb, hsl);
    console.assert(hsl.b >= 0 && hsl.b <= 1, rgb, hsl);
    if (h !== null) console.assert(fnear(h, hsl.r), rgb, hsl);
    if (sl !== null) console.assert(fnear(sl, hsl.g), rgb, hsl);
    if (l !== null) console.assert(fnear(l, hsl.b), rgb, hsl);
    const rgbv = hsv.hsv2Rgb;
    console.assert(isNear(rgb, rgbv), rgb, hsv, rgbv);
    const rgbl = hsl.hsl2Rgb;
    console.assert(isNear(rgb, rgbl), rgb, hsl, rgbl);
    const rgbvc = rgb.rgb2Hsvc.hsvc2Rgb;
    console.assert(isNear(rgb, rgbvc), rgb, rgb.rgb2Hsv, rgb.rgb2Hsvc, rgbvc);
    const rgblc = rgb.rgb2Hslc.hslc2Rgb;
    console.assert(isNear(rgb, rgblc), rgb, rgb.rgb2Hsl, rgb.rgb2Hslc, rgblc);
  }

  //         R  G  B h6 sv  v sl  l
  testSpaces(0, 0, 0, 0, 0, 0, 0, 0);
  testSpaces(1, 1, 1, 0, 0, 1, 0, 1);
  testSpaces(0.5, 0.5, 0.5, 0, 0, 0.5, 0, 0.5);
  testSpaces(1, 0, 0, 0, 1, 1, 1, 0.5);
  testSpaces(1, 1, 0, 1, 1, 1, 1, 0.5);
  testSpaces(0, 1, 0, 2, 1, 1, 1, 0.5);
  testSpaces(0, 1, 1, 3, 1, 1, 1, 0.5);
  testSpaces(0, 0, 1, 4, 1, 1, 1, 0.5);
  testSpaces(1, 0, 1, 5, 1, 1, 1, 0.5);
  testSpaces(0.75, 0.75, 0, 1, 1, 0.75, 1, 0.375);
  testSpaces(0, 0.5, 0, 2, 1, 0.5, 1, 0.25);
  testSpaces(0.5, 1, 1, 3, 0.5, 1, 1, 0.75);
  testSpaces(0.5, 0.5, 1, 4, 0.5, 1, 1, 0.75);
  testSpaces(0.75, 0.25, 0.75, 5, 2 / 3, 0.75, 0.5, 0.5);
  for (let i = 0; i < 1000; ++i) {
    testSpaces(Math.random(), Math.random(), Math.random());
  }*/

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
  ];
  const kWhiteInst = 23;

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
    let c = hexColor(imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]);
    if (white && nearest(c) == kWhiteInst) {
      c = c.min(kColors[kWhiteInst]);
    }
    a.push(c);
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
