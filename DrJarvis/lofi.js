const kLoFiBarsPerChord = 2;
const kLoFiBeatsPerChord = kLoFiBarsPerChord * kBar;
function getLoFiChord(ctx, t) {
  return ctx.chords[Math.floor(t / kLoFiBeatsPerChord)];
}

function genLoFiChords(ctx) {
  return genChordNotes(ctx.chords, ctx.chordInst.inst, kLoFiBeatsPerChord);
}

function genLoFiBass(ctx) {
  return genBassline(ctx.chords, ctx.bassInst.inst, kLoFiBeatsPerChord);
}

const kLoFiSubMelodyStructure = new Structure([2], [0, 0, 0, 0]);
function genLoFiSubMelody(ctx) {
  return genStructuredMelody(
      t => getLoFiChord(ctx, t), ctx.melodySInst, 0.5, 6, 0.8, 0,
      kLoFiSubMelodyStructure);
}

const kLoFiMainMelodyStructure = new Structure([1, 2, 2], [0, 0, 1, 0, 0, 2])
function genLoFiMainMelody(ctx) {
  return genStructuredMelody(
      t => getLoFiChord(ctx, t), ctx.melody1Inst, 0.5, 5, 1, 1,
      kLoFiMainMelodyStructure);
}

const kLoFiAltMelodyStructure = new Structure([2, 2], [0, 0, 1, 0]);
function genLoFiAltMelody(ctx) {
  return genStructuredMelody(
      t => getLoFiChord(ctx, t), ctx.melody2Inst, 0.5, 5, 1, 0.5,
      kLoFiAltMelodyStructure);
}

function genLoFiMarkers(ctx, sections) {
  return genDownMarkers(ctx, sections);
}

function genLoFiInstSettings(ctx) {
  return genDownInstSettings(ctx);
}

function genLoFiAtmo(ctx) {
  return genDownAtmo(ctx);
}

function genLoFiDrums(ctx, vigor) {
  return genDownDrums(ctx, vigor);
}

function genLoFiMarkerEffect(t) {
  return genDownMarkerEffect(t);
}

function genLoFiCtx() {
  const key = randi(11);
  const ctx = {
    key: key,
    chords: genChords(kSection / kLoFiBarsPerChord, key),
    kick: choose(kDrumKicks),
    snare1: choose(kDrumSnares),
    snare2: choose(kDrumSnares),
    hat1: choose(kDrumHats),
    hat2: choose(kDrumHats),
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
      genLoFiMarkerEffect((1 * kSection - 1) * kBar),
      genLoFiMarkerEffect((4 * kSection - 1) * kBar),
      genLoFiMarkerEffect((7 * kSection - 1) * kBar),
    ],
  };
  ctx.drums = new Set([
    ctx.kick, ctx.snare1, ctx.snare2, ctx.hat1, ctx.hat2, ctx.cymbal,
    ...ctx.atmo
  ]);
  ctx.tunedInst = new Set([
    ctx.chordInst, ctx.bassInst, ctx.melody1Inst, ctx.melody2Inst,
    ctx.melodySInst
  ]);
  ctx.allInst = new Set([...ctx.drums, ...ctx.tunedInst]);
  return ctx;
}

async function genLoFi() {
  const ctx = genLoFiCtx();

  const chords = genLoFiChords(ctx);
  const bass = genLoFiBass(ctx);
  const melodyS = genLoFiSubMelody(ctx);
  const melody1 = genLoFiMainMelody(ctx);
  const melody2 = genLoFiAltMelody(ctx);

  function sect(dv, ...args) {
    return merge(
        melodyS, bass, genLoFiAtmo(ctx), genLoFiDrums(ctx, dv), ...args);
  }
  const sections = [
    sect(-1),
    /* effect[0] */
    sect(0, chords),
    sect(0, melody1),
    sect(0.5),
    /* effect[1] */
    sect(1, chords, melody1),
    sect(-1, melody2),
    sect(0, chords, melody2),
    /* effect[2] */
    sect(0.5, melody2),
    sect(1, chords, melody1, melody2),
    sect(-1),
  ];

  const notes = joinSections(sections);

  // Dummy note after the end of the song to prevent loops.
  notes.push(drumNote(ctx.cymbal, sections.length * kSection * kBar + kBar, 0));

  // Instrument settings.
  genLoFiInstSettings(ctx);

  // Markers.
  const markers = genLoFiMarkers(ctx, sections);

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
  for (const m of markers) seq.addMarkers(m);
  for (const note of finalNotes) {
    const p = note.asProto;
    if (p !== null) seq.addNotes(p);
  }

  return seq;
}

async function genLoFiDrumSeq() {
  const ctx = genLoFiCtx();

  function sect(dv) {
    return merge(genLoFiAtmo(ctx), genLoFiDrums(ctx, dv));
  }
  const sections = [
    merge(genLoFiAtmo(ctx), genLoFiDrums(ctx, 0)),
    merge(genLoFiAtmo(ctx), genLoFiDrums(ctx, 0.5)),
    merge(genLoFiAtmo(ctx), genLoFiDrums(ctx, 1)),
  ];

  const notes = joinSections(sections);

  // Instrument settings.
  genLoFiInstSettings(ctx);

  // Apply swing.
  const beatMidpoint = randb() ? 0.5 : 0.666666;
  const finalNotes = notes.map(n => n.swing(beatMidpoint));

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
