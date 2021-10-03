const kStudyBarsPerChord = 1;
const kStudyBeatsPerChord = kStudyBarsPerChord * kBar;
function getStudyChord(ctx, t) {
  const i = mod(Math.floor(t / kStudyBeatsPerChord), ctx.chords.length);
  return ctx.chords[i];
}

function genStudyChords(ctx) {
  return genPlainChordNotes(
      ctx.chords, ctx.mainInst.inst, kStudyBeatsPerChord, 4, false, 0.5);
}

function genStudyBass(ctx) {
  return genBassline(ctx.chords, ctx.bassInst.inst, kStudyBeatsPerChord);
}

const kStudySubMelodyStructure = new Structure([2], [0, 0, 0, 0]);
function genStudySubMelody(ctx) {
  return genStructuredMelody(
      t => getStudyChord(ctx, t), ctx.melodySInst, 0.5, 6, 0.8, 0,
      kStudySubMelodyStructure);
}

function genStudyAtmo(ctx) {
  return genDownAtmo(ctx);
}

function genStudyDrums(ctx, vigor) {
  return genDownDrums(ctx, vigor);
}

function genStudyCtx() {
  const key = randi(11);
  const ctx = {
    key: key,
    chords: genTwinChords(kSection, key),
    kick: choose(kDrumKicks),
    snare1: choose(kDrumSnares),
    snare2: choose(kDrumSnares),
    hat1: choose(kDrumHats),
    hat2: choose(kDrumHats),
    cymbal: choose(kDrumCymbals),
    bassInst: choose(kBassInst),
    mainInst: chordInst(41, 2),
    melodySInst: choose(kMelodyInst),
    atmo: [choose(kDrumAll), choose(kDrumAll), choose(kDrumAll)],
    drums: null,
    tunedInst: null,
    allInst: null,
    instSettings: new Map(),
  };
  ctx.drums = new Set([
    ctx.kick, ctx.snare1, ctx.snare2, ctx.hat1, ctx.hat2, ctx.cymbal,
    ...ctx.atmo
  ]);
  ctx.tunedInst = new Set([ctx.bassInst, ctx.mainInst, ctx.melodySInst]);
  ctx.allInst = new Set([...ctx.drums, ...ctx.tunedInst]);
  return ctx;
}

function genStudyInstSettings(ctx) {
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
  settings(ctx.mainInst.inst).setPan(randf(-0.3, 0.3));
  settings(ctx.melodySInst.inst).setPan(randf(-0.8, 0.8));
  for (const a of ctx.atmo) settings(a.inst).setPan(randf(-1, 1));

  // Overwrite panning on drums and bass, in case they're the same as one of the
  // other instruments. These instruments should always have little to no pan.
  settings(ctx.kick.inst).setPan(randf(-0.1, 0.1));
  settings(ctx.snare1.inst).setPan(randf(-0.1, 0.1));
  settings(ctx.snare2.inst).setPan(randf(-0.1, 0.1));
  settings(ctx.hat1.inst).setPan(randf(-0.1, 0.1));
  settings(ctx.hat2.inst).setPan(randf(-0.1, 0.1));
  settings(ctx.cymbal.inst).setPan(randf(-0.1, 0.1));
  settings(ctx.bassInst.inst).setPan(randf(-0.1, 0.1));

  // Drum detunes.
  function randomDetune(inst) {
    settings(inst).setDetune(randf(-1200, 1200));
  }
  for (const d of ctx.drums) randomDetune(d.inst);

  // For lo-fi, the snares and cymbals should be faded.
  setEq(settings(ctx.snare1.inst), choose(kFadedEqSettings));
  setEq(settings(ctx.snare2.inst), choose(kFadedEqSettings));
  setEq(settings(ctx.cymbal.inst), choose(kFadedEqSettings));

  // Bass and chords eq.
  setEq(settings(ctx.bassInst.inst), eq(-48, 0, 20));

  // Randomize reverb effects.
  const kEffects = [
    [1, 1], [2, 1], [3, 1], [4, 1], [5, 0.5], [6, 0.5], [7, 0.5], [8, 0.5],
    [9, 0.1], [10, 0.5], [11, 0.3]
  ];
  function chooseEffect(inst) {
    const s = settings(inst);
    const [e, v] = choose(kEffects);
    s.setReverb(e != 0);
    s.setReverbType(e);
    s.setOneMinusReverbVolume(1 - randf(1, 0.2) * v);
  }
  chooseEffect(ctx.kick.inst);
  chooseEffect(ctx.snare1.inst);
  chooseEffect(ctx.snare2.inst);
  chooseEffect(ctx.hat1.inst);
  chooseEffect(ctx.hat2.inst);
  chooseEffect(ctx.cymbal.inst);
  chooseEffect(ctx.bassInst.inst);
  chooseEffect(ctx.melodySInst.inst);
  settings(ctx.mainInst.inst).setReverb(true);
  settings(ctx.mainInst.inst).setReverbType(3);
  settings(ctx.mainInst.inst).setOneMinusReverbVolume(0.5);
}

async function genStudy() {
  const ctx = genStudyCtx();

  const bass = genStudyBass(ctx);
  const chords = genStudyChords(ctx);
  const melodyS = genStudySubMelody(ctx);

  function melody() {
    return genFractalMelody(
        t => getStudyChord(ctx, t), ctx.mainInst.inst, 16 * kSection, 0.25, 5,
        6, 2, 1);
  }
  function sect(dv, ...args) {
    return merge(bass, genStudyAtmo(ctx), genStudyDrums(ctx, dv), ...args);
  }
  const sections = [
    sect(-1, chords),
    sect(0, chords),
    sect(0, melodyS),
    sect(0.5, melodyS),
    sect(0.5, chords, melodyS),
    sect(1, chords, melodyS),
    sect(1, chords, melodyS),
    sect(-1, chords),
    sect(-1, melodyS),
    sect(0, chords),
    sect(0, melodyS),
    sect(0.5, melodyS),
    sect(0.5, chords, melodyS),
    sect(1, chords, melodyS),
    sect(1, chords, melodyS),
    sect(-1),
  ];

  const totalBars = sections.length * kSection;
  const notes = merge(joinSections(sections), melody());

  // Dummy note after the end of the song to prevent loops.
  notes.push(drumNote(ctx.cymbal, totalBars * kBar + kBar, 0));

  // Instrument settings.
  genStudyInstSettings(ctx);

  // Apply swing.
  const beatMidpoint = randb() ? 0.5 : 0.666666;
  const finalNotes = notes.map(n => n.swing(beatMidpoint));

  // Add a thumbnail.
  const thumbNotes = genThumbNotes();
  for (const n of thumbNotes) finalNotes.push(n);

  // Generate proto.
  const seq = new proto.Sequence();
  const seqSettings = new proto.SequenceSettings();
  seqSettings.setBpm(randi(100, 70));
  seq.setSettings(seqSettings);
  for (const [inst, settings] of ctx.instSettings) {
    seqSettings.getInstrumentsMap().set(inst, settings);
  }
  for (const note of finalNotes) {
    const p = note.asProto;
    if (p !== null) seq.addNotes(p);
  }

  return seq;
}
