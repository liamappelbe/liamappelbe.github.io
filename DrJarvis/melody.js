class MelodicRhythmNote {
  constructor(t, triad, index, index2 = null, rep = false) {
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
    let index2 = null;
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
        index = randi(kScaleLen - 1);
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
        if (triad && index2 !== null) {
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

class FractalMelodyChunk {
  constructor(id) {
    this.id = id;
    this.shape = null;
    this.rhythm = null;
  }
}

function genFractalMelodyStructure(layers, repetitiveness) {
  let base = 0;
  function gen(n) {
    const a = [0];
    let max = 0;
    while (a.length < 4) a.push(randb(repetitiveness) ? randi(max) : ++max);
    if (n <= 1) {
      const b = a.map(k => k + base);
      base += max + 1;
      return b;
    }
    const cc = new ArrayCache(() => gen(n - 1));
    return a.map(k => cc.get(k)).flat();
  }
  const cc = new ArrayCache(k => new FractalMelodyChunk(k));
  return gen(layers).map(k => cc.get(k));
}

function genFractalMelody(
    getChord, inst, numBars, dt, lowOct, highOct, vol, vigor) {
  // There are 4 phases to the generator: structure, shape, rhythm, and notes.
  // 1. Generate a radix 4 random fractal structure with the given number of
  //    bars (must be a power of 2).
  // 2. Fill in the shape of each chunk using a lerped perlin noise algorithm,
  //    and blend the shapes of fresh chunks into the previous chunk.
  // 3. Generate the melodic rhythm using genEmphasisEx and the shape.
  // 4. Generate the notes from the melodic rhythm and the chords.
  const kRoughness = 0.75;
  const kRepetitiveness = 0.5;
  const kPhraseLimit = 0.5;

  // 1. Structure.
  let layers = 0;
  let chunkSize = numBars;
  while (chunkSize >= 4) {
    ++layers;
    chunkSize /= 4;
    console.assert(chunkSize == Math.floor(chunkSize));
  }
  console.assert(chunkSize == 1 || chunkSize == 2);
  const structure = genFractalMelodyStructure(layers, kRepetitiveness);
  console.log(numBars, layers, chunkSize, structure.length);

  // 2. Shape.
  const chunkLen = chunkSize * kBar;
  const ticks = chunkLen / dt;
  const octaves = Math.ceil(Math.log2(ticks));
  for (let i = 0; i < structure.length; ++i) {
    const s = structure[i];
    if (s.shape == null) {
      const leftShape = i > 0 ? structure[i - 1].shape : null;
      s.shape = new LerpNoise(octaves, leftShape, kRoughness);
    }
  }

  // 3. Rhythm.
  function triadNote(t) {
    const index = randi(2);
    let index2 = null;
    if (randb(0.3)) {
      // Add a second triad note.
      index2 = index;
      while (index2 == index) index2 = randi(2);
    }
    return new MelodicRhythmNote(t, true, index, index2);
  }
  for (let i = 0; i < structure.length; ++i) {
    const s = structure[i];
    if (s.rhythm == null) {
      const sr = [];
      s.rhythm = sr;
      genEmphasisEx(
          chunkLen, dt, 0.3, lerp(0.5, 0.9, vigor), 0.8, 0, (t, e) => {
            const triad = randb(lerp(0, lerp(0.3, 0.7, vigor), e));
            if (triad) {
              sr.push(triadNote(t));
            } else {
              // Add a non-triad note, using the shape.
              const y = s.shape.get(t / chunkLen);
              const index = Math.round(kScaleLen * lerp(lowOct, highOct, y));
              sr.push(new MelodicRhythmNote(t, false, index));
            }
          });
      // We still need to maintain that invariant that phrases end on a triad
      // note, even though we're not actually using explicit phrases anymore.
      let pt = Infinity;
      for (let i = sr.length - 1; i >= 0; --i) {
        const sri = sr[i];
        if (pt - sri.t > kPhraseLimit) {
          // End of a phrase.
          sr[i] = triadNote(sri.t);
        }
        pt = sri.t;
      }
      console.log(sr.length);
    }
  }

  // 4. Notes.
  const scale = getChord(0).scale();
  const notes = [];
  function firstNonTriadIndex() {
    for (const s of structure) {
      for (const r of s.rhythm) {
        if (!r.triad) return getWithOctaves(scale, r.index);
      }
    }
    return Math.round(kScaleLen * randf(lowOct, highOct));
  }
  let pj = firstNonTriadIndex();
  function wrap(j) {
    if (pj === null) return j;
    j = mod(j, 12);
    while (pj - j > 7) j += 12;
    while (j - pj > 7) j -= 12;
    return j;
  }
  for (let i = 0; i < structure.length; ++i) {
    const toff = i * chunkLen;
    console.log(structure[i].rhythm, toff);
    for (const r of structure[i].rhythm) {
      const v = vol * lerp(0.5, 1.0, beatEmphasis(r.t));
      const t = toff + r.t;
      console.log(t);
      if (r.triad) {
        const ch = getChord(r.t);
        const tri = ch.triadIndexes();
        notes.push(new Note(
            noteType(wrap(getWithOctaves(tri, r.index))), t, dt, inst, v));
        if (r.index2 !== null) {
          notes.push(new Note(
              noteType(wrap(getWithOctaves(tri, r.index2))), t, dt, inst, v));
        }
      } else {
        notes.push(new Note(
            noteType(pj = getWithOctaves(scale, r.index)), t, dt, inst, v));
      }
    }
  }
  return notes;
}
