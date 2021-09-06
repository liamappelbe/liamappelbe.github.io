const kDrumSnaresDnB = [
  drum(2, 'D3'), drum(2, 'E3'), drum(31, 'D3'), drum(31, 'E3'), drum(39, 'A#2'),
  drum(39, 'B2'), drum(40, 'A2'), drum(40, 'A#2'), drum(40, 'B2'),
  drum(40, 'C3'), drum(40, 'G#4'), drum(40, 'A#4'), drum(36, 'A2'),
  drum(36, 'G#2'), drum(42, 'G2'), drum(42, 'F#2'), drum(42, 'G#2')
];
const kDrumHatsDnB = [
  drum(2, 'F#3'), drum(2, 'G#3'), drum(31, 'F#3'), drum(31, 'G#3'),
  drum(39, 'A2'), drum(40, 'D3'), drum(36, 'B2'), drum(42, 'F3'),
  drum(42, 'F#3')
];
const kDrumRidesDnB = [
  drum(2, 'D#4'), drum(2, 'F4'), drum(2, 'B4'), drum(31, 'D#4'), drum(31, 'F4'),
  drum(31, 'B4'), drum(40, 'G4'), drum(40, 'C#4'), drum(40, 'B3'),
  drum(42, 'A#3')
];

const kDnBTrillDt = 0.125;
const kDnBTrillVol = 0.18;
function genDnBDrumsOneBar(ctx, bar, vigor) {
  const first = bar == 0;
  const notes = [];

  function add(inst, t, vol = 1) {
    notes.push(drumNote(inst, t, vol));
  }

  function addNoteMaybeTrill(inst, t, vol = 1) {
    addNoteWithTrill(
        notes, inst, t, vol, randb(0.2 * vigor + 0.1) ? randi(2, 1) : 0,
        kDnBTrillDt, kDnBTrillVol);
  }

  // Core rhythm.
  if (first) add(ctx.cymbal, 0);
  if ((bar % 2 == 0) || randb(0.7)) {
    add(ctx.kick, 0);
    add(ctx.snare1, 1);
    add(ctx.kick, 2.5);
    add(ctx.snare1, first || randb(0.6) ? 3 : 3.5);
  } else {
    add(ctx.kick, 0);
    add(ctx.snare1, 1);
    add(ctx.kick, 1.5);
    add(ctx.snare1, 2.5);
    add(ctx.kick, 3);
  }
  if (vigor > 0.7) add(ctx.snare2, choose([0.25, 0.5, 0.75]), 0.15);
  if (vigor > 0.3) add(ctx.snare2, 1.75, 0.2);
  if (vigor > 0.3) add(ctx.snare2, 2.25, 0.2);
  if (vigor > 0.7) add(ctx.snare2, choose([3.25, 3.5, 3.75]), 0.15);

  // Extras.
  if (randb(lerp(0.2, 0.6, vigor))) {
    addNoteMaybeTrill(ctx.kick, randBeat(2.5, 0.5, 0.5), 0.25);
  }
  if (randb(lerp(0.2, 0.6, vigor))) {
    addNoteMaybeTrill(ctx.snare1, randBeat(4, 0.5, 0.5), 0.25);
  }

  // Hats.
  for (let i = 0; i < kBar; ++i) {
    add(ctx.hat1, i, 0.25);
    add(ctx.hat2, i + 0.5, 0.5);
    if (vigor > 0.3) {
      addNoteMaybeTrill(ctx.ride1, i + 0.5, 0.5);
      const r = lerp(0.0, 0.6, vigor);
      if (randb(r)) addNoteMaybeTrill(ctx.ride2, i + 0.25, 0.25);
      if (randb(r)) addNoteMaybeTrill(ctx.ride2, i + 0.75, 0.25);
    }
  }
  return notes;
}

function genDnBDrumsOneBarBreak(ctx, vigor) {
  const notes = [];
  function addNoteMaybeTrill(inst, t, vol = 1) {
    addNoteWithTrill(
        notes, inst, t, vol, randb(0.1 * vigor + 0.05) ? randi(2, 1) : 0,
        kDnBTrillDt, kDnBTrillVol);
  }

  // Beats.
  genEmphasisEx(
      kBar, 0.25, 0.0, lerp(0.3, 0.6, vigor), 0.6, 0.0,
      (t, e) => addNoteMaybeTrill(ctx.kick, t, e));
  genEmphasisEx(
      kBar, 0.25, 0.0, lerp(0.3, 0.6, vigor), 0.6, 0.5,
      (t, e) => addNoteMaybeTrill(ctx.snare1, t, e));
  genEmphasisEx(
      kBar, 0.25, 0.0, lerp(0.2, 0.5, vigor), 0.6, 0.5,
      (t, e) => addNoteMaybeTrill(ctx.snare2, t, e * 0.3));

  // Hats.
  for (let i = 0; i < kBar; ++i) {
    notes.push(drumNote(ctx.hat1, i, 0.25));
    notes.push(drumNote(ctx.hat2, i + 0.5, 0.5));
    if (vigor > 0.3) {
      addNoteMaybeTrill(ctx.ride1, i + 0.5, 0.5);
      const r = lerp(0.0, 0.6, vigor);
      if (randb(r)) addNoteMaybeTrill(ctx.ride2, i + 0.25, 0.25);
      if (randb(r)) addNoteMaybeTrill(ctx.ride2, i + 0.75, 0.25);
    }
  }
  return notes;
}

function genDnBAtmo(ctx) {
  const notes = [];
  const dt = 0.25;
  for (let k = 0; k < kSection; ++k) {
    const end = randBeat(kBar * kSection, 0, 0.5);
    const start = Math.max(0, end - randBeat(1.5, 0.25, 0.25));
    for (let t = start; t <= end; t += dt) {
      const vol = 0.8 * (t == end ? 1 : Math.min(1, beatEmphasis(t) + 0.4));
      const n = choose(ctx.atmo);
      notes.push(new Note(n.type, t, dt, n.inst, vol));
    }
  }
  return notes;
}

function genDnBDrums(ctx, vigor) {
  const bars = [];
  for (let i = 0; i < kSection - 1; ++i) {
    bars.push(genDnBDrumsOneBar(ctx, i, vigor));
  }
  bars.push(genDnBDrumsOneBarBreak(ctx, vigor));
  return merge(joinBars(bars), genDnBAtmo(ctx));
}

function genDnBBreakDrumsOneBar(ctx) {
  const notes = [];
  function addNoteMaybeTrill(inst, t, vol = 1) {
    addNoteWithTrill(
        notes, inst, t, vol, randb(0.1) ? randi(2, 1) : 0, kDnBTrillDt,
        kDnBTrillVol);
  }

  // Beats.
  addNoteMaybeTrill(ctx.snare1, 1);
  addNoteMaybeTrill(ctx.snare1, 3);

  return notes;
}

function genDnBBreakDrums(ctx) {
  const bars = [];
  for (let i = 0; i < kSection - 1; ++i) {
    bars.push(genDnBBreakDrumsOneBar(ctx));
  }
  bars.push(genDnBDrumsOneBarBreak(ctx, 0));
  return joinBars(bars);
}

const kDnBBarsPerChord = 2;
const kDnBBeatsPerChord = kDnBBarsPerChord * kBar;
function getDnBChord(ctx, t) {
  return ctx.chords[Math.floor(t / kDnBBeatsPerChord)];
}

function genDnBChords(ctx) {
  const notes = [];
  const style = randi(2);
  const vol = 0.5;
  if (style == 0) {
    // Plain chords, optionally decimated.
    const dec = randb(0.3);
    const len = 2;
    for (let i = 0; i < ctx.chords.length; ++i) {
      const ch = ctx.chords[i].noteIndexesFolded();
      for (let j = 0; j < ch.length; ++j) {
        for (let t = 0; t < kDnBBeatsPerChord; t += len) {
          if (j != 0 && dec && randb(0.2)) continue;
          notes.push(new Note(
              noteType(chordVoice(ch[j], 2), 3), i * kDnBBeatsPerChord + t, len,
              ctx.chordInst.inst, vol * (j == 0 ? 1 : randf(1, 0.5))));
        }
      }
    }
  } else if (style == 1) {
    // Chords with a random rhythm.
    function makeRhythm() {
      const rhythm = [];
      for (let t = 0; t < kDnBBeatsPerChord;) {
        rhythm.push(t);
        t += randw([0, 1, 3, 5]) * 0.5;
      }
      return rhythm;
    }
    function makeChords(i, rhythm) {
      const ch = ctx.chords[i].noteIndexesFolded();
      const t0 = i * kDnBBeatsPerChord;
      const addNote = (n, v) => {
        for (let k = 0; k < rhythm.length; ++k) {
          const t = rhythm[k];
          const t2 = k < rhythm.length - 1 ? rhythm[k + 1] : kDnBBeatsPerChord;
          notes.push(new Note(
              noteType(n, 3), t0 + t, t2 - 0.125 - t, ctx.chordInst.inst,
              v * vol));
        }
      };
      addNote(ch[0], 0.5);
      addNote(ch[0] + 12, 0.5);
      for (let j = 1; j < ch.length; ++j) {
        addNote(chordVoice(ch[j], 2), randf(0.4, 0.25));
      }
    }
    console.assert(ctx.chords.length == 4);
    const r0 = makeRhythm();
    const r1 = makeRhythm();
    makeChords(0, r0);
    makeChords(1, r0);
    makeChords(2, r0);
    makeChords(3, r1);
  } else if (style == 2) {
    // Arpegios, in a random direction.
    const dir = randi(kPossibleArpDirs - 1);
    const oct = randi(2, 1);
    const len = choose([0.5, 1]);
    for (let i = 0; i < ctx.chords.length; ++i) {
      const ch = ctx.chords[i].noteIndexesFolded();
      for (let t = 0, j = 0; t < kDnBBeatsPerChord; t += len, ++j) {
        const k = arpIndex(j, ch.length * oct, dir);
        notes.push(new Note(
            noteType(ch[mod(k, ch.length)], 3 + Math.floor(k / ch.length)),
            i * kDnBBeatsPerChord + t, len, ctx.chordInst.inst,
            vol * (mod(k, ch.length) == 0 ? 1 : randf(1, 0.5))));
      }
    }
  }
  return notes;
}

function genDnBBass(ctx) {
  return genBassline(ctx.chords, ctx.bassInst.inst, kDnBBeatsPerChord);
}

function genDnBMelody(ctx, inst, dt, oct, vol, vigor, structure) {
  const all = ctx.chords[0].scale();
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
        const ch = getDnBChord(ctx, t);
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
  if (structure == 0) {
    const a = genMelodyChunk(2 * kBar, dt, vigor);
    addChunk(a, 0);
    addChunk(a, 2);
    addChunk(a, 4);
    addChunk(a, 6);
  } else if (structure == 1) {
    const a = genMelodyChunk(1 * kBar, dt, vigor);
    const b = genMelodyChunk(2 * kBar, dt, vigor);
    const c = genMelodyChunk(2 * kBar, dt, vigor);
    addChunk(a, 0);
    addChunk(a, 1);
    addChunk(b, 2);
    addChunk(a, 4);
    addChunk(a, 5);
    addChunk(c, 6);
  } else if (structure == 2) {
    const a = genMelodyChunk(2 * kBar, dt, vigor);
    const b = genMelodyChunk(2 * kBar, dt, vigor);
    addChunk(a, 0);
    addChunk(a, 2);
    addChunk(b, 4);
    addChunk(a, 6);
  }

  // Add an extra triad note at the start of the next section.
  notes.push(new Note(
      noteType(choose(ctx.chords[0].triadIndexes()), oct), kSection * kBar, dt,
      inst.inst, vol));

  return notes;
}

function genDnBSubMelody(ctx) {
  // ctx, inst, dt, oct, vol, vigor, structure
  return genDnBMelody(ctx, ctx.melodySInst, 0.5, 6, 0.8, 0, 0);
}

function genDnBSlowMelody(ctx) {
  return genDnBMelody(ctx, ctx.melody1Inst, 0.5, 5, 1, 0, 1);
}

function genDnBMainMelody(ctx) {
  return genDnBMelody(ctx, ctx.melody1Inst, 0.25, 5, 1, 1, 1);
}

function genDnBSlowAltMelody(ctx) {
  return genDnBMelody(ctx, ctx.melody2Inst, 0.5, 5, 1, 0, 2);
}

function genDnBAltMelody(ctx) {
  return genDnBMelody(ctx, ctx.melody2Inst, 0.25, 5, 1, 0.5, 2);
}

function genDnBInstSettings(ctx) {
  function setEq(settings, eq) {
    settings.setEnableEq(true);
    settings.setEqHigh(eq.high);
    settings.setEqMid(eq.mid);
    settings.setEqLow(eq.low);
  }
  ctx.instSettings = new Map();
  function settings(inst) {
    if (!ctx.instSettings.has(inst)) {
      const settings = new proto.InstrumentSettings();
      ctx.instSettings.set(inst, settings);
      settings.setVolume(1);
      setEq(settings, eq(randf(3, -3), randf(3, -3), randf(3, -3)));
    }
    return ctx.instSettings.get(inst);
  }
  for (const i of ctx.allInst) settings(i.inst);

  // Panning.
  settings(ctx.chordInst.inst).setPan(randf(-0.3, 0.3));
  const m1pan = randf(-0.8, 0.8);
  settings(ctx.melody1Inst.inst).setPan(m1pan);
  settings(ctx.melody2Inst.inst).setPan(-m1pan);
  settings(ctx.melodySInst.inst).setPan(randf(-1, 1));
  for (const a of ctx.atmo) settings(a.inst).setPan(randf(-1, 1));

  // Overwrite panning on drums and bass, in case they're the same as one of the
  // other instruments. These instruments should always have little to no pan.
  for (const d of ctx.drums) settings(d.inst).setPan(randf(-0.1, 0.1));
  settings(ctx.bassInst.inst).setPan(randf(-0.1, 0.1));

  // Drum detunes.
  function randomDetune(inst) {
    settings(inst).setDetune(randf(-600, 1200));
  }
  for (const d of ctx.drums) randomDetune(d.inst);

  // EQ bass, chords, and some of the drums.
  setEq(settings(ctx.bassInst.inst), eq(-48, 0, 20));
  setEq(settings(ctx.chordInst.inst), eq(0, 0, 10));
  setEq(settings(ctx.snare1.inst), eq(5, 0, 0));
  setEq(settings(ctx.snare2.inst), eq(5, 0, -48));
  setEq(settings(ctx.kick.inst), eq(0, 0, ctx.kick.inst == 36 ? 0 : 10));

  // Randomize reverb effects.
  const kEffects = [
    [1, 1], [2, 1], [3, 1], [4, 1], [5, 0.5], [6, 0.5], [7, 0.5], [8, 0.5],
    [9, 0.1], [10, 0.5], [11, 0.3]
  ];
  function chooseEffect(inst) {
    const s = settings(inst);
    if (randb(0.5)) {
      const [e, v] = choose(kEffects);
      s.setReverb(e != 0);
      s.setReverbType(e);
      s.setOneMinusReverbVolume(1 - randf(1, 0.2) * v);
    } else {
      s.setReverb(false);
    }
  }
  // chooseEffect(ctx.kick.inst);
  // chooseEffect(ctx.snare1.inst);
  // chooseEffect(ctx.snare2.inst);
  // chooseEffect(ctx.hat1.inst);
  // chooseEffect(ctx.hat2.inst);
  // chooseEffect(ctx.cymbal.inst);
  chooseEffect(ctx.bassInst.inst);
  chooseEffect(ctx.chordInst.inst);
  chooseEffect(ctx.melody1Inst.inst);
  chooseEffect(ctx.melody2Inst.inst);
  chooseEffect(ctx.melodySInst.inst);
}

function genDnB() {
  const key = randi(11);
  const ctx = {
    key: key,
    chords: genChords(kSection / kDnBBarsPerChord, key),
    kick: choose(kDrumKicks),
    snare1: choose(kDrumSnaresDnB),
    snare2: choose(kDrumSnares),
    hat1: choose(kDrumHatsDnB),
    hat2: choose(kDrumHatsDnB),
    ride1: choose(kDrumRidesDnB),
    ride2: choose(kDrumRidesDnB),
    cymbal: choose(kDrumCymbals),
    bassInst: choose(kBassInst),
    chordInst: choose(kChordsInst),
    melody1Inst: choose(kMelodyInst),
    melody2Inst: choose(kMelodyInst),
    melodySInst: choose(kMelodyInst),
    atmo: [choose(kDrumAll), choose(kDrumAll), choose(kDrumAll)],
    drums: null,
    tunedInst: null,
    allInst: null,
    effectIntro: genLoFiMarkerEffect((1 * kSection - 1) * kBar),
    effectBridge: genLoFiMarkerEffect((6 * kSection - 1) * kBar),
  };
  ctx.drums = new Set([
    ctx.kick, ctx.snare1, ctx.snare2, ctx.hat1, ctx.hat2, ctx.ride1, ctx.ride2,
    ctx.cymbal, ...ctx.atmo
  ]);
  ctx.tunedInst = new Set([
    ctx.chordInst, ctx.bassInst, ctx.melody1Inst, ctx.melody2Inst,
    ctx.melodySInst
  ]);
  ctx.allInst = new Set([...ctx.drums, ...ctx.tunedInst]);

  const subMelody = genDnBSubMelody(ctx);
  const slowMelody = genDnBSlowMelody(ctx);
  const mainMelody = genDnBMainMelody(ctx);
  const main2Melody = genDnBMainMelody(ctx);
  const altMelody = genDnBSlowAltMelody(ctx);
  const alt2Melody = genDnBAltMelody(ctx);
  const chords = genDnBChords(ctx);
  const bass = genDnBBass(ctx);

  const s1 = merge(genDnBDrums(ctx, 0), subMelody);
  const s2 = merge(genDnBDrums(ctx, 0.5), chords, bass, subMelody, slowMelody);
  const s3 = merge(genDnBDrums(ctx, 0), bass, subMelody, altMelody);
  const s4 = merge(genDnBDrums(ctx, 1), chords, bass, subMelody, slowMelody);
  const s5 = merge(genDnBDrums(ctx, 1), chords, bass, subMelody, mainMelody);
  const s6 = merge(genDnBDrums(ctx, 0), bass, subMelody, altMelody);
  const s7 = merge(genDnBDrums(ctx, 1), chords, subMelody, bass);
  const s8 = merge(genDnBBreakDrums(ctx), bass, subMelody, altMelody);
  const s9 = merge(genDnBDrums(ctx, 0), bass, subMelody, slowMelody);
  const s10 = merge(genDnBDrums(ctx, 0.5), chords, bass, subMelody, mainMelody);
  const s11 = merge(
      genDnBDrums(ctx, 1), chords, bass, subMelody, mainMelody, altMelody);
  const s12 = merge(
      genDnBDrums(ctx, 1), chords, bass, subMelody, main2Melody, alt2Melody);
  const s13 = merge(genDnBDrums(ctx, 0), bass, subMelody);

  const sections = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13];
  const notes = joinSections(sections);

  // const sections = [
  //     secIntro, secVerse1, secChorus1, secVerse2, secChorus2, secBridge,
  //     secChorus3, secOutro, secOutro2];
  // const notes = joinSections(sections);

  // Dummy note after the end of the song to prevent loops.
  notes.push(drumNote(ctx.cymbal, sections.length * kSection * kBar + kBar, 0));

  // Instrument settings.
  genDnBInstSettings(ctx);

  const markers = [];

  // Generate proto.
  const seq = new proto.Sequence();
  const seqSettings = new proto.SequenceSettings();
  seqSettings.setBpm(randi(140, 180));
  seq.setSettings(seqSettings);
  for (const [inst, settings] of ctx.instSettings) {
    seqSettings.getInstrumentsMap().set(inst, settings);
  }
  for (const m of markers) seq.addMarkers(m);
  for (const note of notes) {
    const p = note.asProto;
    if (p !== null) seq.addNotes(p);
  }

  return seq;
}
