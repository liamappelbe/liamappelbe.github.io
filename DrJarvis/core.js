let randSeed = 0n;
function setSeed(seed = null) {
  if (seed == null) {
    randSeed = 0n;
    for (let i = 0; i < 16; ++i) {
      randSeed <<= 8n;
      randSeed |= BigInt(~~(0x100 * Math.random()));
    }
  } else {
    randSeed = seed;
  }
  return randSeed;
}
setSeed();

function randImpl() {
  const r = Number(randSeed & 0xFFFFFFFFn);
  for (let i = 0; i < 32; ++i) {
    const b = (randSeed >> 128n) ^ (randSeed >> 126n) ^ (randSeed >> 101n) ^
        (randSeed >> 99n);
    randSeed = (randSeed >> 1n) | ((b & 1n) << 127n);
  }
  return r / (1 << 16) / (1 << 16);
}

function randb(p = 0.5) {
  return randImpl() < p;
}

function randf(h = 1, l = 0) {
  return l + randImpl() * (h - l);
}

function randi(h = 1, l = 0) {
  return Math.floor(randf(h + 1, l));
}

function randfq(h = 1) {
  return h * (randImpl() ** 2);
}

function randBeat(h, l, q) {
  return randi(h / q - 1, l / q) * q;
}

function randVol(h, l = 0.2) {
  return 2 ** randf(Math.log2(h), Math.log2(l));
}

function choose(array) {
  return array[randi(array.length - 1)];
}

function chooseq(array) {
  return array[Math.floor(randfq(array.length))];
}

function mod(x, y) {
  return ((x % y) + y) % y;
}

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

function ilerp(a, b, y) {
  return (y - a) / (b - a);
}

function linmap(a1, b1, y1, a2, b2) {
  return lerp(a2, b2, ilerp(a1, b1, y1));
}

function randw(w) {
  let r = randf(w.reduce((x, y) => x + y));
  for (let i = 0; i < w.length; ++i) {
    r -= w[i];
    if (r <= 0) return i;
  }
  return w.length - 1;
}

function getWithOctaves(a, i) {
  const o = Math.floor(i / a.length);
  const j = i - o * a.length;
  console.assert(j < a.length && j >= 0, j);
  return o * 12 + a[j];
}

function noteType(key, octave = 0) {
  const kNoteTypeNames =
      ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const i = mod(key, 12);
  const o = octave + Math.floor((key - i) / 12);  // In case key >= 12 or < 0.
  return kNoteTypeNames[i] + o;
}

function noteTypeToProto(type) {
  return proto.NoteType[type.replace('#', 'S')];
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function validNoteType(type) {
  try {
    return isNumber(noteTypeToProto(type));
  } catch {
    return false;
  }
}

function lowestSetBit(x) {
  return x & -x;
}

class ArrayCache {
  constructor(f) {
    this.a = [];
    this.f = f;
  }
  get(i) {
    while (this.a.length <= i) this.a.push(this.f(this.a.length));
    return this.a[i];
  }
}
