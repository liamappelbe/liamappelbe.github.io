function mod(x, y) {
  return ((x % y) + y) % y;
}

function randb(p = 0.5) {
  return Math.random() < p;
}

function randf(h = 1, l = 0) {
  return l + Math.random() * (h - l);
}

function randi(h = 1, l = 0) {
  return Math.floor(randf(h + 1, l));
}

function randfq(h = 1) {
  return h * (Math.random() ** 2);
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

function noteType(key, octave) {
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
