function saveBlob(filename, data, type) {
  var file = new Blob(data, {type: type});
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else {
    var a = document.createElement('a');
    var url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

function protoToBlob(seq) {
  try {
    return seq.serializeBinary();
  } catch (e) {
    console.log('Serializing sequence failed', e);
    console.log(seq.toObject());
    return null;
  }
}

function genName() {
  return `The ${choose(kAdjectives)} ${choose(kColors)} ${
      choose(kAnimals)}.sequence`;
}

function generate(generator) {
  const blob = protoToBlob(generator());
  if (!blob) return;
  const name = genName() + '';
  saveBlob(name, [blob], 'application/octet-stream');
}

function getVolWeight(inst, index) {
  const a = kVolWeights[inst];
  return (a instanceof Map ? a.get(index) : a) || 0;
}

// I'm representing note times and lengths as a float number of beats, whereas
// OS represents them as a number of quarter beats.
function noteTimeToOsFormat(time) {
  return 4 * time;
}

class Note {
  constructor(type, time, len, inst, vol) {
    this.type = type;
    this.time = time;
    this.len = len;
    this.inst = inst;
    this.vol = vol;
  }

  shift(dt) {
    return new Note(this.type, this.time + dt, this.len, this.inst, this.vol);
  }

  swing(newMidpoint) {
    const intTime = Math.floor(this.time);
    const fractTime = this.time - intTime;
    const newTime = intTime +
        (fractTime < 0.5 ? linmap(0, 0.5, fractTime, 0, newMidpoint) :
                           linmap(0.5, 1, fractTime, newMidpoint, 1));
    return new Note(this.type, newTime, this.len, this.inst, this.vol);
  }

  get asProto() {
    if (!validNoteType(this.type)) return null;
    const np = new proto.Note();
    const index = noteTypeToProto(this.type);
    np.setType(index);
    np.setTime(noteTimeToOsFormat(this.time));
    np.setLength(this.len > 0 ? noteTimeToOsFormat(this.len) : 1);
    np.setInstrument(this.inst);
    np.setVolume(this.vol / getVolWeight(this.inst, index));
    return np;
  }
}

class Chord {
  constructor(base, minor, seventh = false, ninth = false, sus4 = false) {
    this.base = base;
    this.minor = minor;
    this.seventh = seventh;
    this.ninth = ninth;
    this.sus4 = sus4;
  }

  _apply(n) {
    return n.map(i => (i + this.base - (this.minor ? 3 : 0)));
  }

  triadIndexes() {
    return this._apply([0, 4 - this.minor, 7]);
  }
  noteIndexes() {
    const n = [0, this.sus4 ? 5 : 4 - this.minor, 7];  // In semitones.
    if (this.seventh) n.push(11 - this.minor);
    if (this.ninth) n.push(14);
    return this._apply(n);
  }

  noteIndexesFolded() {
    const n = this.noteIndexes().map(i => mod(i - this.base, 12) + this.base);
    n.sort((x, y) => x - y);
    return n;
  }

  scale() {
    return this._apply(this.minor ? kMinorScale : kMajorScale);
  }
}

function genChords(n, key) {
  const kChordBases = [0, 5, 7];  // I, IV, V, in semitones
  const chords = [new Chord(key, randb())];
  for (let i = 1; i < n; ++i) {
    const kind = randw([4, 3, 2, 1]);
    chords.push(new Chord(
        choose(kChordBases) + key, randb(), kind == 1, kind == 2, kind == 3));
  }
  return chords;
}

function genTwinChords(n, key) {
  const m = Math.floor(n / 2);
  return merge(genChords(m, key), genChords(n - m, key));
}

function marker(time, setting, inst, value, blend = false) {
  var m = new proto.Marker();
  m.setTime(noteTimeToOsFormat(time));
  m.setSetting(setting);
  m.setInstrument(inst);
  m.setValue(value);
  m.setBlend(blend);
  return m;
}

function drumNote(drumType, time, vol = 1, length = 0) {
  return new Note(drumType.type, time, length, drumType.inst, vol);
}

function chordsToNotes(chords, key = 0, octave = 4, instrument = 41) {
  const notes = [];
  for (let i = 0; i < chords.length; ++i) {
    for (const j of chords[i].noteIndexes(key)) {
      notes.push(new Note(noteType(j, octave), i * kBar, kBar, instrument, 1));
    }
  }
  return notes;
}

function merge(...args) {
  out = [];
  for (let i = 0; i < args.length; ++i) {
    for (const n of args[i]) out.push(n);
  }
  return out;
}

function joinBars(args) {
  out = [];
  for (let i = 0; i < args.length; ++i) {
    for (const n of args[i]) out.push(n.shift(i * kBar));
  }
  return out;
}

function joinSections(args) {
  out = [];
  for (let i = 0; i < args.length; ++i) {
    for (const n of args[i]) out.push(n.shift(i * kBar * kSection));
  }
  return out;
}

function beatEmphasis(t) {
  const kBeatRes = 8;
  const i = Math.floor(0.5 + mod(t, kBar) * kBeatRes);
  if (i == 0) return 1;
  return Math.log2(lowestSetBit(i)) / Math.log2(kBar * kBeatRes);
}

function genEmphasisEx(length, dt, p0, p1, emphCap, ot, fn) {
  for (let t = 0; t < length; t += dt) {
    const e = Math.min(1, beatEmphasis(t + ot) / emphCap);
    if (randb(lerp(p0, p1, e))) fn(t, e);
  }
}

function genEmphasisBar(p0, p1, fn) {
  return genEmphasisEx(kBar, 0.25, p0, p1, 1, 0, fn);
}

function addNoteWithTrill(notes, inst, t, vol, trillLen, trillDt, trillVol) {
  notes.push(drumNote(inst, t, vol));
  for (let i = 1; i <= trillLen; ++i) {
    notes.push(drumNote(inst, t - i * trillDt, vol * trillVol, trillDt));
  }
}

function chordVoice(idx, octh = 0, octl = 0) {
  return 12 * randi(octh, octl) + idx;
}

kPossibleArpDirs = 4;
function arpIndex(x, n, d) {
  if (d == 0 || d == 1) {
    // Saw wave.
    return mod(d == 0 ? x : -1 - x, n);
  } else if (d == 2 || d == 3) {
    // Triangle wave.
    const m = n - 1;
    const y = mod(d == 2 ? x : x + m, 2 * m);
    return y < n ? y : m - 1 - mod(y, n);
  }
}

class MelodicRhythmNote {
  constructor(t, triad, index, index2, rep) {
    this.t = t;
    this.triad = triad;
    this.index = index;
    this.index2 = index2;
    this.rep = rep;
  }
}

class MelodicRhythm {
  constructor(t0, a = null) {
    this.t0 = t0;
    this.a = a === null ? [] : a;
  }
  add(t, triad, index, index2, rep = false) {
    this.a.push(new MelodicRhythmNote(t - this.t0, triad, index, index2, rep));
  }
  get length() {
    return this.a.length;
  }
  get last() {
    return this.length == 0 ? null : this.a[this.length - 1];
  }
  forEach(toff, fn) {
    for (const n of this.a) {
      fn(toff + this.t0 + n.t, n.triad, n.index, n.index2);
    }
  }
  find(t) {
    for (const n of this.a) {
      if (this.t0 + n.t == t) return n;
    }
    return null;
  }
  repeat(rt, t) {
    const n = this.find(rt);
    if (n != null) this.add(t, n.triad, n.index, n.index2, true);
  }
  finish() {
    const n = this.last;
    n.triad = true;  // End the phrase on a triad note.
    n.index = randi(2);
    return this;
  }
}

class MarkerEffect {
  constructor(t0) {
    this.t0 = t0;
    this.volumePulses = 0;  // 0, 1, 2, 3, 4
    this.eqFade = 0;  // -1, 0, 1
    this.detuneDescent = false;
    this.crossPan = false;
    this.dropDrums = false;
    this.dropMelody = false;
    this.dropChords = false;
    this.dropBass = false;
  }
}

function genChordsImpl(genChordsFn, len) {
  const key = randi(11);
  const chords = genChordsFn(len, key);
  const notes = [];
  for (let i = 0; i < chords.length; ++i) {
    const ch = chords[i].noteIndexes();
    for (let j = 0; j < ch.length; ++j) {
      notes.push(
          new Note(noteType(ch[j], 4), i * kBar, kBar, 41, j == 0 ? 1 : 0.5));
    }
  }
  const seq = new proto.Sequence();
  for (const note of notes) {
    const p = note.asProto;
    if (p !== null) seq.addNotes(p);
  }
  return seq;
}

function genShortChords() {
  return genChordsImpl(genChords, 4);
}

function genLongChords() {
  return genChordsImpl(genTwinChords, 8);
}
