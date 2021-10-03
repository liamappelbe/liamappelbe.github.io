const kStudyBarsPerChord = 1;
const kStudyBeatsPerChord = kStudyBarsPerChord * kBar;
function getStudyChord(ctx, t) {
  const i = mod(Math.floor(t / kStudyBeatsPerChord), ctx.chords.length);
  return ctx.chords[i];
}

function genStudyChords(ctx) {
  return genPlainChordNotes(ctx.chords, 41, kStudyBeatsPerChord, 4, false, 0.5);
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

async function genStudy() {
  const ctx = genStudyCtx();

  const bass = genLoFiBass(ctx);
  const chords = genStudyChords(ctx);
  const melodyS = genLoFiSubMelody(ctx);

  function melody() {
    return genFractalMelody(
        t => getStudyChord(ctx, t), 41, 16 * kSection, 0.25, 5, 6, 2, 1);
  }
  function sect(dv, ...args) {
    return merge(bass, genLoFiAtmo(ctx), genLoFiDrums(ctx, dv), ...args);
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
  // genLoFiInstSettings(ctx);

  // Markers.
  const markers = [];  // genLoFiMarkers(ctx, sections);

  // Apply swing.
  const beatMidpoint = randb() ? 0.5 : 0.666666;
  const finalNotes = notes.map(n => n.swing(beatMidpoint));

  // Add a thumbnail.
  // const thumbNotes = genThumbNotes();
  // for (const n of thumbNotes) finalNotes.push(n);

  // Generate proto.
  const seq = new proto.Sequence();
  const seqSettings = new proto.SequenceSettings();
  seqSettings.setBpm(randi(100, 70));
  seq.setSettings(seqSettings);
  /*for (const [inst, settings] of ctx.instSettings) {
    seqSettings.getInstrumentsMap().set(inst, settings);
  }*/
  for (const m of markers) seq.addMarkers(m);
  for (const note of finalNotes) {
    const p = note.asProto;
    if (p !== null) seq.addNotes(p);
  }

  return seq;
}
