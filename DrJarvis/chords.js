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

function chordsToNotes(chords, key = 0, octave = 4, instrument = 41) {
  const notes = [];
  for (let i = 0; i < chords.length; ++i) {
    for (const j of chords[i].noteIndexes(key)) {
      notes.push(new Note(noteType(j, octave), i * kBar, kBar, instrument, 1));
    }
  }
  return notes;
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

function genPlainChordNotes(chords, inst, beatsPerChord, dt, dec, vol = 0.5) {
  const notes = [];
  for (let i = 0; i < chords.length; ++i) {
    const ch = chords[i].noteIndexesFolded();
    for (let j = 0; j < ch.length; ++j) {
      for (let t = 0; t < beatsPerChord; t += dt) {
        if (j != 0 && dec && randb(0.2)) continue;
        notes.push(new Note(
            noteType(chordVoice(ch[j], 2), 3), i * beatsPerChord + t, dt, inst,
            vol * (j == 0 ? 1 : randf(1, 0.5))));
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
    notes = genPlainChordNotes(chords, inst, beatsPerChord, 2, randb(0.3), vol);
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
