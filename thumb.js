// TODO:
//  - Playlist thumbnails (2x2, so need 4 copy buttons).
//  - Hide clamping and the following options in an advanced section.
//  - Configurable dither direction.
//  - Configurable clamping limits.
//  - Tweakable colors (by default, just fix the white issue).

let generateThumbnail_context = null;
function generateThumbnail(image, options, addNote) {
  function fclamp(x) {
    return x <= 0 ? 0 : x >= 1 ? 1 : x;
  }

  class Color {
    constructor(r, g, b, a) {
      this.r = r;
      this.g = g;
      this.b = b;
    }

    diff(c) {
      return new Color(this.r - c.r, this.g - c.g, this.b - c.b);
    }

    dist2(c) {
      const e = this.diff(c);
      return e.r * e.r + e.g * e.g + e.b * e.b;
    }

    mulAdd(c, k) {
      return new Color(this.r + k * c.r, this.g + k * c.g, this.b + k * c.b);
    }

    clamp() {
      return new Color(fclamp(this.r), fclamp(this.g), fclamp(this.b));
    }
  }

  function hexColor(red, green, blue) {
    return new Color(red / 0xFF, green / 0xFF, blue / 0xFF);
  }

  function pixIndex(w, h, i, j) {
    return j * w + i;
  }

  function ditherPixel(a, w, h, i, j, e, x, clamp) {
    if (i >= 0 && i < w && j >= 0 && j < h) {
      const k = pixIndex(w, h, i, j);
      const c = a[k].mulAdd(e, x);
      a[k] = clamp ? c.clamp() : c;
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
    hexColor(0x82, 0x05, 0x15), hexColor(0x03, 0xA9, 0xF4),
    hexColor(0x98, 0x00, 0xFE),
  ];

  const small = options.small ?? false;
  const wide = options.wide ?? true;
  const invis = options.invis ?? false;
  const clamp = options.clamp ?? true;
  const dither = options.dither ?? 1;
  const len = invis ? 0.000001 : wide ? 1 : 2;
  const base = small ? 3 * 12 + 5 /*F3*/ : 2 * 12 + 8 /*G#2*/;
  const h = small ? 32 : 50;
  const w = wide ? 2 * h + 1 : h;

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
      let mk = 0;
      let md2 = 0;
      for (let k = 0; k < kColors.length; ++k) {
        const d2 = c.dist2(kColors[k]);
        if (k == 0 || d2 < md2) {
          mk = k;
          md2 = d2;
        }
      }
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
    outData[4 * i + 0] = 0xFF * b[i].r;
    outData[4 * i + 1] = 0xFF * b[i].g;
    outData[4 * i + 2] = 0xFF * b[i].b;
    outData[4 * i + 3] = 0xFF;
  }
  const out = new ImageData(outData, w, h);
  buf.putImageData(out, 0, 0);
  return view;
}
