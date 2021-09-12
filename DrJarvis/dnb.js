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
  return genChordNotes(ctx.chords, ctx.chordInst.inst, kDnBBeatsPerChord, 0.8);
}

function genDnBBass(ctx) {
  return genBassline(ctx.chords, ctx.bassInst.inst, kDnBBeatsPerChord);
}

const kDnBSubMelodyStructure = new Structure([2], [0, 0, 0, 0]);
function genDnBSubMelody(ctx) {
  return genStructuredMelody(
      t => getDnBChord(ctx, t), ctx.melodySInst, 0.5, 6, 0.8, 0,
      kDnBSubMelodyStructure);
}

const kDnBMainMelodyStructure = new Structure([1, 2, 2], [0, 0, 1, 0, 0, 2])
function genDnBSlowMelody(ctx) {
  return genStructuredMelody(
      t => getDnBChord(ctx, t), ctx.melody1Inst, 0.5, 5, 1, 0,
      kDnBMainMelodyStructure);
}

function genDnBMainMelody(ctx) {
  return genStructuredMelody(
      t => getDnBChord(ctx, t), ctx.melody1Inst, 0.25, 5, 1, 1,
      kDnBMainMelodyStructure);
}

const kDnBAltMelodyStructure = new Structure([2, 2], [0, 0, 1, 0]);
function genDnBSlowAltMelody(ctx) {
  return genStructuredMelody(
      t => getDnBChord(ctx, t), ctx.melody2Inst, 0.5, 5, 1, 0,
      kDnBAltMelodyStructure);
}

function genDnBAltMelody(ctx) {
  return genStructuredMelody(
      t => getDnBChord(ctx, t), ctx.melody2Inst, 0.25, 5, 1, 0.5,
      kDnBAltMelodyStructure);
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

  for (const i of [ctx.melody1Inst, ctx.melody2Inst, ctx.melodySInst]) {
    if (randb(0.5)) setEq(settings(i.inst), choose(kFadedEqSettings));
  }

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
  chooseEffect(ctx.bassInst.inst);
  chooseEffect(ctx.chordInst.inst);
  chooseEffect(ctx.melody1Inst.inst);
  chooseEffect(ctx.melody2Inst.inst);
  chooseEffect(ctx.melodySInst.inst);
}

function genDnBMarkers(ctx) {
  const markers = [];

  function eqMarker(time, inst, eq, fade = false) {
    markers.push(marker(time, kMSEqH, inst, eq.high, fade));
    markers.push(marker(time, kMSEqM, inst, eq.mid, fade));
    markers.push(marker(time, kMSEqL, inst, eq.low, fade));
  }

  function getDefaultEq(inst) {
    const s = ctx.instSettings.get(inst);
    return eq(s.getEqHigh(), s.getEqMid(), s.getEqLow());
  }

  // Apply marker effects.
  for (const e of ctx.effects) {
    if (e.volumePulses != 0) {
      const kBeats = [0, 2, 1, 3];
      for (let i = 0; i < e.volumePulses; ++i) {
        const t = e.t0 + kBeats[i];
        markers.push(marker(t, kMSVol, 0, 1));
        markers.push(marker(t + 0.5, kMSVol, 0, 0, true));
      }
      markers.push(marker(e.t0 + kBar, kMSVol, 0, 1));
    }
    function allInstrumentEq(t, eq, fade = false) {
      for (const i of ctx.allInst) {
        eqMarker(t, i.inst, eq === null ? getDefaultEq(i.inst) : eq, fade);
      }
    }
    if (e.eqFade == 1) {
      allInstrumentEq(e.t0, choose(kFadedEqSettings));
      allInstrumentEq(e.t0 + kBar - 0.25, null, true);
    } else if (e.eqFade == -1) {
      allInstrumentEq(e.t0, null);
      allInstrumentEq(e.t0 + kBar - 0.25, choose(kFadedEqSettings), true);
      allInstrumentEq(e.t0 + kBar, null);
    }
    if (e.detuneDescent) {
      for (const i of ctx.allInst) {
        const dd = ctx.instSettings.get(i.inst).getDetune();
        markers.push(marker(e.t0, kMSDetune, i.inst, dd));
        markers.push(marker(e.t0 + kBar - 1, kMSDetune, i.inst, -1200, true));
        markers.push(marker(e.t0 + kBar, kMSDetune, i.inst, dd));
      }
    }
    if (e.crossPan) {
      for (const i of ctx.allInst) {
        const dp = ctx.instSettings.get(i.inst).getPan();
        const p = randb() ? -1 : 1;
        markers.push(marker(e.t0, kMSPan, i.inst, dp));
        markers.push(marker(e.t0 + kBar - 1, kMSPan, i.inst, p, true));
        markers.push(marker(e.t0 + kBar, kMSPan, i.inst, dp));
      }
    }
    function dropInst(drop, insts) {
      if (!drop) return;
      for (const i of insts) {
        markers.push(marker(e.t0 + 0.25, kMSInstVol, i.inst, 1));
        markers.push(marker(e.t0 + 0.5, kMSInstVol, i.inst, 0, true));
        markers.push(marker(e.t0 + kBar, kMSInstVol, i.inst, 1));
      }
    }
    dropInst(e.dropDrums, ctx.drums);
    dropInst(e.dropMelody, [ctx.melody1Inst, ctx.melody2Inst, ctx.melodySInst]);
    dropInst(e.dropChords, [ctx.chordInst]);
    dropInst(e.dropBass, [ctx.bassInst]);
  }

  return markers;
}

function genDnBMarkerEffect(t) {
  const effect = new MarkerEffect(t);
  const type = randw([2, 2, 1, 1, 3]);
  if (type == 0) {
    effect.volumePulses = randi(4, 1);
  } else if (type == 1) {
    effect.eqFade = randb() ? -1 : 1;
  } else if (type == 2) {
    effect.detuneDescent = true;
  } else if (type == 3) {
    effect.crossPan = true;
  } else if (type == 4) {
    effect.dropDrums = randb();
    effect.dropMelody = randb();
    effect.dropChords = randb();
    effect.dropBass = randb();
  }
  return effect;
}

async function genDnB() {
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
    effects: [
      genDnBMarkerEffect((1 * kSection - 1) * kBar),
      genDnBMarkerEffect((3 * kSection - 1) * kBar),
      genDnBMarkerEffect((7 * kSection - 1) * kBar),
      genDnBMarkerEffect((10 * kSection - 1) * kBar),
      genDnBMarkerEffect((12 * kSection - 1) * kBar),
    ],
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

  const sections = [
    merge(genDnBDrums(ctx, 0), subMelody),
    /* effect[0] */
    merge(genDnBDrums(ctx, 0.5), chords, bass, subMelody, slowMelody),
    merge(genDnBDrums(ctx, 0), bass, subMelody, altMelody),
    /* effect[1] */
    merge(genDnBDrums(ctx, 1), chords, bass, subMelody, slowMelody),
    merge(genDnBDrums(ctx, 1), chords, bass, subMelody, mainMelody),
    merge(genDnBDrums(ctx, 1), chords, bass, subMelody, altMelody, mainMelody),
    merge(genDnBDrums(ctx, 0), bass, subMelody, altMelody),
    /* effect[2] */
    merge(genDnBDrums(ctx, 1), chords, subMelody, bass),
    merge(genDnBBreakDrums(ctx), bass, subMelody, altMelody),
    merge(genDnBDrums(ctx, 0), bass, subMelody, slowMelody),
    /* effect[3] */
    merge(genDnBDrums(ctx, 0.5), chords, bass, subMelody, mainMelody),
    merge(genDnBDrums(ctx, 1), chords, bass, subMelody, mainMelody, altMelody),
    /* effect[4] */
    merge(
        genDnBDrums(ctx, 1), chords, bass, subMelody, main2Melody, alt2Melody),
    merge(genDnBDrums(ctx, 0), bass, subMelody),
  ];

  const notes = joinSections(sections);

  // Dummy note after the end of the song to prevent loops.
  notes.push(drumNote(ctx.cymbal, sections.length * kSection * kBar + kBar, 0));

  // Instrument settings.
  genDnBInstSettings(ctx);

  // Markers.
  const markers = genDnBMarkers(ctx, sections);

  // Add a thumbnail.
  const thumbNotes = await genThumbNotes();
  for (const n of thumbNotes) notes.push(n);

  // Generate proto.
  const seq = new proto.Sequence();
  const seqSettings = new proto.SequenceSettings();
  seqSettings.setBpm(randi(130, 180));
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
