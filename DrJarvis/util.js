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

async function generate(generator) {
  const blob = protoToBlob(await generator());
  if (!blob) return;
  const name = genName() + '';
  saveBlob(name, [blob], 'application/octet-stream');
}

function getVolWeight(inst, index) {
  const a = kVolWeights[inst];
  return (a instanceof Map ? a.get(index) : a) || 1;
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

function genMelodyChunk(length, dt, vigor) {
  // The most important constraint for melody generation is to end every phrase
  // on a note from the current chord's triad. Using the usual breatEmphasis
  // based rhythm generation, a new phrase is defined as any time there's more
  // than half a beat between notes. At this point we just generate the rhythms,
  // because some of the notes depend on which chord the chunk is in.
  console.assert(kMajorScale.length == kMinorScale.length);
  const phraseLimit = 0.5;
  const phrases = [];
  let phrase = null;
  let pt = -2 * phraseLimit;
  let lastNonTriadIndex = null;
  let repTime = 0;
  let repStop = 0;
  for (let t = 0; t < length; t += dt) {
    if (repTime >= repStop && phrase != null && t > (phrase.t0 + 2 * dt) &&
        randb(0.1)) {
      // Begin new repetition.
      repStop = t;
      repTime = randBeat(t - dt, phrase.t0, dt);
    }
    if (repTime < repStop) {
      // Continue the repetition.
      phrase.repeat(repTime, t);
      repTime += dt;
      continue;
    }
    const e = Math.min(1, beatEmphasis(t) / 0.8);
    if (!randb(lerp(0.3, lerp(0.5, 0.9, vigor), e))) continue;
    // Add a new beat here.
    if (phrase === null || t - pt > phraseLimit) {
      if (phrase !== null) phrases.push(phrase.finish());
      phrase = new MelodicRhythm(t);
    }
    const triad = randb(lerp(0, lerp(0.3, 0.7, vigor), e));
    let index;
    let index2 = -1;
    if (triad) {
      // Add a triad note.
      index = randi(2);
      if (randb(0.3)) {
        // Add a second triad note.
        index2 = index;
        while (index2 == index) index2 = randi(2);
      }
    } else {
      // Add a non-triad note.
      if (lastNonTriadIndex === null) {
        // Pick a random note from the scale.
        index = randi(kMajorScale.length - 1);
      } else {
        // Step up or down from the last non-triad note.
        index = lastNonTriadIndex + [-2, -1, 0, 1, 2][randw([2, 3, 1, 3, 2])];
      }
      lastNonTriadIndex = index;
    }
    phrase.add(t, triad, index, index2);
    pt = t;
  }
  if (phrase !== null) phrases.push(phrase.finish());
  return phrases;
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

let domThumbImage = null;
function newThumbImage(url = null) {
  domThumbImage.src = url ?? `https://picsum.photos/200?random=${randi(1e9)}`;
}

window.addEventListener('load', () => {
  domThumbImage = document.getElementById('thumb');
  newThumbImage();
});

async function genThumbNotes() {
  const notes = [];
  const options = {invis: true};
  generateThumbnail(domThumbImage, options, (type, t, len, inst) => {
    notes.push(new Note(type, t / 4, len / 4, inst, 0));
  });
  newThumbImage();
  return notes;
}

async function genThumb(url = null) {
  const notes = await genThumbNotes(url);
  const seq = new proto.Sequence();
  for (const note of notes) {
    const p = note.asProto;
    if (p !== null) seq.addNotes(p);
  }
  return seq;
}

function genBassline(chords, inst, beatsPerChord) {
  const notes = [];
  const len = 0.5;
  for (let i = 0; i < chords.length; ++i) {
    const ch = chords[i].triadIndexes();
    for (let t = 0; t < beatsPerChord; t += len) {
      if (t == 0 || randb(0.4)) {
        notes.push(new Note(
            noteType(mod(choose(ch), 12), 2), i * beatsPerChord + t, len, inst,
            randf(1, 0.5)));
      }
    }
  }
  return notes;
}

function genChordNotes(chords, inst, beatsPerChord, vol = 0.5) {
  const notes = [];
  const style = randi(2);
  if (style == 0) {
    // Plain chords, optionally decimated.
    const dec = randb(0.3);
    const len = 2;
    for (let i = 0; i < chords.length; ++i) {
      const ch = chords[i].noteIndexesFolded();
      for (let j = 0; j < ch.length; ++j) {
        for (let t = 0; t < beatsPerChord; t += len) {
          if (j != 0 && dec && randb(0.2)) continue;
          notes.push(new Note(
              noteType(chordVoice(ch[j], 2), 3), i * beatsPerChord + t, len,
              inst, vol * (j == 0 ? 1 : randf(1, 0.5))));
        }
      }
    }
  } else if (style == 1) {
    // Chords with a random rhythm.
    function makeRhythm() {
      const rhythm = [];
      for (let t = 0; t < beatsPerChord;) {
        rhythm.push(t);
        t += randw([0, 1, 3, 5]) * 0.5;
      }
      return rhythm;
    }
    function makeChords(i, rhythm) {
      const ch = chords[i].noteIndexesFolded();
      const t0 = i * beatsPerChord;
      const addNote = (n, v) => {
        for (let k = 0; k < rhythm.length; ++k) {
          const t = rhythm[k];
          const t2 = k < rhythm.length - 1 ? rhythm[k + 1] : beatsPerChord;
          notes.push(
              new Note(noteType(n, 3), t0 + t, t2 - 0.125 - t, inst, v * vol));
        }
      };
      addNote(ch[0], 0.5);
      addNote(ch[0] + 12, 0.5);
      for (let j = 1; j < ch.length; ++j) {
        addNote(chordVoice(ch[j], 2), randf(0.4, 0.25));
      }
    }
    const r0 = makeRhythm();
    const r1 = makeRhythm();
    for (let i = 0; i < chords.length - 1; ++i) makeChords(i, r0);
    makeChords(chords.length - 1, r1);
  } else if (style == 2) {
    // Arpegios, in a random direction.
    const dir = randi(kPossibleArpDirs - 1);
    const oct = randi(2, 1);
    const len = choose([0.5, 1]);
    for (let i = 0; i < chords.length; ++i) {
      const ch = chords[i].noteIndexesFolded();
      for (let t = 0, j = 0; t < beatsPerChord; t += len, ++j) {
        const k = arpIndex(j, ch.length * oct, dir);
        notes.push(new Note(
            noteType(ch[mod(k, ch.length)], 3 + Math.floor(k / ch.length)),
            i * beatsPerChord + t, len, inst,
            vol * (mod(k, ch.length) == 0 ? 1 : randf(1, 0.5))));
      }
    }
  }
  return notes;
}

class Structure {
  constructor(lens, layout) {
    this.lens = lens;
    this.layout = layout;
  }
}

function genStructuredMelody(getChord, inst, dt, oct, vol, vigor, structure) {
  const all = getChord(0).scale();
  const notes = [];
  let pj = null;
  function wrap(j) {
    if (pj === null) return j;
    j = mod(j, 12);
    while (pj - j > 7) j += 12;
    while (j - pj > 7) j -= 12;
    return j;
  }
  function addChunk(phrases, barOffset) {
    const toff = barOffset * kBar;
    for (const phrase of phrases) {
      phrase.forEach(toff, (t, triad, index, index2) => {
        const ch = getChord(t);
        const tri = ch.triadIndexes();
        const j = triad ? wrap(getWithOctaves(tri, index)) :
                          getWithOctaves(all, index);
        const v = lerp(0.6, 1, beatEmphasis(t)) * vol;
        notes.push(new Note(noteType(j, oct), t, dt, inst.inst, v));
        if (triad && index2 != -1) {
          const j2 = wrap(getWithOctaves(tri, index2));
          notes.push(new Note(noteType(j2, oct), t, dt, inst.inst, v));
        }
        pj = j;
      });
    }
  }
  const chunks = [];
  for (const l of structure.lens) {
    chunks.push(genMelodyChunk(l * kBar, dt, vigor));
  }
  let t = 0;
  for (const k of structure.layout) {
    addChunk(chunks[k], t);
    t += structure.lens[k];
  }
  console.assert(t == kSection);

  // Add an extra triad note at the start of the next section.
  notes.push(new Note(
      noteType(choose(getChord(0).triadIndexes()), oct), kSection * kBar, dt,
      inst.inst, vol));

  return notes;
}
