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

function genDnBDrums(ctx, vigor) {
  const bars = [];
  for (let i = 0; i < kSection - 1; ++i) {
    bars.push(genDnBDrumsOneBar(ctx, i, vigor));
  }
  bars.push(genDnBDrumsOneBarBreak(ctx, vigor));
  return joinBars(bars);
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
}

function genDnB() {
  const key = randi(11);
  const ctx = {
    key: key,
    chords: genTwinChords(kSection, key),
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
  ctx.tunedInst =
      new Set([ctx.chordInst, ctx.bassInst, ctx.melody1Inst, ctx.melody2Inst]);
  ctx.allInst = new Set([...ctx.drums, ...ctx.tunedInst]);

  const notes = joinSections(
      [genDnBDrums(ctx, 0), genDnBDrums(ctx, 0.5), genDnBDrums(ctx, 1)]);

  // const sections = [
  //     secIntro, secVerse1, secChorus1, secVerse2, secChorus2, secBridge,
  //     secChorus3, secOutro, secOutro2];
  // const notes = joinSections(sections);

  // Dummy note after the end of the song to prevent loops.
  // notes.push(drumNote(ctx.cymbal, sections.length * kSection * kBar + kBar,
  // 0));

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
