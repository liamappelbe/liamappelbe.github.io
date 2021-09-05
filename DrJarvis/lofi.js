const kLoFiTrillDt = 0.125;
const kLoFiTrillVol = 0.25;
function genLoFiDrumsOneBar(ctx, first, vigor) {
  const notes = [
    drumNote(ctx.kick, 0),
    drumNote(ctx.kick, randb() ? 2 : 2.5),
  ];

  function addNoteMaybeTrill(inst, t, vol = 1) {
    addNoteWithTrill(
        notes, inst, t, vol, randb(0.2 * vigor) ? randi(2, 1) : 0, kLoFiTrillDt,
        kLoFiTrillVol);
  }
  addNoteMaybeTrill(ctx.snare1, 1);
  addNoteMaybeTrill(ctx.snare1, randb(0.7) ? 3 : 3.5);

  if (first) notes.push(drumNote(ctx.cymbal, 0));

  genEmphasisBar(
      0.1, lerp(0.4, 1, vigor),
      (t, e) => addNoteMaybeTrill(ctx.kick, t, e * randf(1.2, 0.8)));
  genEmphasisBar(
      0.1, lerp(0.4, 1, vigor),
      (t, e) => addNoteMaybeTrill(ctx.snare2, t, e * randf(0.8, 0.5)));

  for (let i = 0; i < kBar; ++i) {
    if (vigor > 0.3) notes.push(drumNote(ctx.hat1, i + 0.5));
    if (vigor > 0.7) notes.push(drumNote(ctx.hat2, i + 0.25, randVol(0.5)));
    if (vigor > 0.7) notes.push(drumNote(ctx.hat2, i + 0.75, randVol(0.5)));
  }
  return notes;
}

function genLoFiDrumsOneBarBreak(ctx, vigor) {
  const notes = [];
  function addNoteMaybeTrill(inst, t, vol = 1) {
    addNoteWithTrill(
        notes, inst, t, vol, randb(0.5 * vigor) ? randi(4, 1) : 0, kLoFiTrillDt,
        kLoFiTrillVol);
  }
  genEmphasisBar(
      0.1, lerp(0.4, 1, vigor),
      (t, e) => addNoteMaybeTrill(ctx.kick, t, e * randf(1.2, 0.8)));
  genEmphasisBar(
      0.1, lerp(0.4, 1, vigor),
      (t, e) => addNoteMaybeTrill(ctx.snare1, t, e * randf(1.2, 0.8)));
  genEmphasisBar(
      0.1, lerp(0.4, 1, vigor),
      (t, e) => addNoteMaybeTrill(ctx.snare2, t, e * randf(0.8, 0.5)));
  for (let i = 0; i < kBar; ++i) {
    if (vigor > 0.3) notes.push(drumNote(ctx.hat1, i + 0.5));
    if (vigor > 0.7) notes.push(drumNote(ctx.hat2, i + 0.25, randVol(0.5)));
    if (vigor > 0.7) notes.push(drumNote(ctx.hat2, i + 0.75, randVol(0.5)));
  }
  return notes;
}

function genLoFiDrums(ctx, vigor) {
  const bars = [];
  for (let i = 0; i < kSection - 1; ++i) {
    bars.push(genLoFiDrumsOneBar(ctx, i == 0, vigor));
  }
  bars.push(genLoFiDrumsOneBarBreak(ctx, vigor));
  return joinBars(bars);
}

function genLoFiChords(ctx) {
  const notes = [];
  const style = randi(1);
  if (style == 0) {
    // Plain chords, optionally decimated.
    const dec = randb(0.3);
    const len = dec ? Math.min(2, ctx.chordInst.susLen) : ctx.chordInst.susLen;
    for (let i = 0; i < ctx.chords.length; ++i) {
      const ch = ctx.chords[i].noteIndexesFolded();
      for (let j = 0; j < ch.length; ++j) {
        for (let t = 0; t < kBar; t += len) {
          if (j != 0 && dec && randb(0.2)) continue;
          notes.push(new Note(
              noteType(chordVoice(ch[j], 2), 3), i * kBar + t, len,
              ctx.chordInst.inst, j == 0 ? 1 : randf(1, 0.5)));
        }
      }
    }
  } else if (style == 1) {
    // Arpegios, in a random direction.
    const dir = randi(kPossibleArpDirs - 1);
    const oct = randi(2, 1);
    const len = choose([0.25, 0.5, 1]);
    for (let i = 0; i < ctx.chords.length; ++i) {
      const ch = ctx.chords[i].noteIndexesFolded();
      for (let t = 0, j = 0; t < kBar; t += len, ++j) {
        const k = arpIndex(j, ch.length * oct, dir);
        notes.push(new Note(
            noteType(ch[mod(k, ch.length)], 3 + Math.floor(k / ch.length)),
            i * kBar + t, len, ctx.chordInst.inst,
            mod(k, ch.length) == 0 ? 1 : randf(1, 0.5)));
      }
    }
  }
  return notes;
}

function genLoFiBass(ctx) {
  const notes = [];
  const len = 0.5;
  for (let i = 0; i < ctx.chords.length; ++i) {
    const ch = ctx.chords[i].triadIndexes();
    for (let t = 0; t < kBar; t += len) {
      if (t == 0 || randb(0.4)) {
        notes.push(new Note(
            noteType(mod(choose(ch), 12), 2), i * kBar + t, len,
            ctx.bassInst.inst, randf(1, 0.5)));
      }
    }
  }
  return notes;
}

function genLoFiMelodyChunk(length, dt, vigor) {
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
    const triad = randb(lerp(0, lerp(0.1, 0.5, vigor), e));
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

function genLoFiMelody(ctx, inst, secondary, vigor) {
  const dt = secondary ? 0.5 : 0.25;
  const oct = secondary ? 6 : 5;
  const vol = secondary ? 0.7 : 1;
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
        const ch = ctx.chords[mod(Math.floor(t / kBar), kSection)];
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
  const a = genLoFiMelodyChunk(2 * kBar, dt, vigor);
  const b = genLoFiMelodyChunk(1 * kBar, dt, vigor);
  const c = genLoFiMelodyChunk(2 * kBar, dt, vigor);
  addChunk(a, 0);
  addChunk(b, 2);
  addChunk(b, 3);
  addChunk(a, 4);
  addChunk(c, 6);

  // Add an extra triad note at the start of the next section.
  notes.push(new Note(
      noteType(choose(ctx.chords[0].triadIndexes()), oct), kSection * kBar, dt,
      inst.inst, vol));

  return notes;
}

function genLoFiAtmo(ctx) {
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

function genLoFiInstSettings(ctx) {
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
  setEq(settings(ctx.chordInst.inst), eq(0, 0, 10));

  // Randomize reverb effects.
  const kEffects = [
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 0.5],
    [6, 0.5],
    [7, 0.5],
    [8, 0.5],
    [9, 0.1],
    [10, 0.5],
    [11, 0.3],
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
  chooseEffect(ctx.kick.inst);
  chooseEffect(ctx.snare1.inst);
  chooseEffect(ctx.snare2.inst);
  chooseEffect(ctx.hat1.inst);
  chooseEffect(ctx.hat2.inst);
  chooseEffect(ctx.cymbal.inst);
  chooseEffect(ctx.bassInst.inst);
  chooseEffect(ctx.chordInst.inst);
  chooseEffect(ctx.melody1Inst.inst);
  chooseEffect(ctx.melody2Inst.inst);
}

function genLoFiMarkers(ctx, sections) {
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

  // Fade in at the start of the song.
  const endOfIntro = kSection * kBar;
  const isFaded = new Set();
  function introFade(inst, eq) {
    const i = inst.inst;
    if (isFaded.has(i)) return;
    isFaded.add(i);
    eqMarker(0, i, eq);
    eqMarker(endOfIntro, i, getDefaultEq(i), true);
  }
  const drumFadedEq = choose(kFadedEqSettings);
  for (d of ctx.drums) introFade(d, drumFadedEq);
  const chordFadedEq = choose(kFadedEqSettings);
  introFade(ctx.chordInst, chordFadedEq);
  markers.push(marker(0, kMSVol, 0, 0.5));
  markers.push(marker(endOfIntro - kBar - 0.25, kMSVol, 0, 0.5));
  markers.push(marker(endOfIntro + 0.25, kMSVol, 0, 1, true));

  // Fade out at the end of the song.
  const startOfFinalSection = (sections.length - 1) * kSection * kBar;
  const endOfSong = sections.length * kSection * kBar;
  eqMarker(
      startOfFinalSection, ctx.chordInst.inst,
      getDefaultEq(ctx.chordInst.inst));
  eqMarker(endOfSong - 4 * kBar, ctx.chordInst.inst, chordFadedEq, true);
  markers.push(marker(startOfFinalSection, kMSVol, 0, 1));
  markers.push(marker(endOfSong - 4 * kBar, kMSVol, 0, 0.5, true));
  markers.push(marker(endOfSong, kMSVol, 0, 0, true));

  // Apply marker effects.
  function effectMarkers(e) {
    if (e.volumePulses != 0) {
      const kBeats = [0, 2, 1, 3];
      for (let i = 0; i < e.volumePulses; ++i) {
        const t = e.t0 + kBeats[i];
        markers.push(marker(t, kMSVol, 0, 1));
        markers.push(marker(t + 0.25, kMSVol, 0, 0, true));
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
    dropInst(e.dropMelody, [ctx.melody1Inst, ctx.melody2Inst]);
    dropInst(e.dropChords, [ctx.chordInst]);
    dropInst(e.dropBass, [ctx.bassInst]);
  }
  effectMarkers(ctx.effectIntro);
  effectMarkers(ctx.effectBridge);

  return markers;
}

function genLoFiMarkerEffect(t) {
  const effect = new MarkerEffect(t);
  const type = randw([10, 3, 1, 2, 10]);
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

function genLoFi() {
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
    ctx.kick, ctx.snare1, ctx.snare2, ctx.hat1, ctx.hat2, ctx.cymbal,
    ...ctx.atmo
  ]);
  ctx.tunedInst =
      new Set([ctx.chordInst, ctx.bassInst, ctx.melody1Inst, ctx.melody2Inst]);
  ctx.allInst = new Set([...ctx.drums, ...ctx.tunedInst]);

  const chords = genLoFiChords(ctx);
  const bass = genLoFiBass(ctx);
  const melody1v1 = genLoFiMelody(ctx, ctx.melody1Inst, false, 0);
  const melody1v2 = genLoFiMelody(ctx, ctx.melody1Inst, false, 0);
  const melody1c = genLoFiMelody(ctx, ctx.melody1Inst, false, 1);
  const melody2 = genLoFiMelody(ctx, ctx.melody2Inst, true, 1);
  const melody2b = genLoFiMelody(ctx, ctx.melody2Inst, false, 0.5);

  const secIntro = merge(genLoFiDrums(ctx, 0), chords, bass, genLoFiAtmo(ctx));
  const secVerse1 =
      merge(genLoFiDrums(ctx, 0.5), chords, bass, melody1v1, genLoFiAtmo(ctx));
  const secChorus1 = merge(
      genLoFiDrums(ctx, 1), chords, bass, melody1c, melody2, genLoFiAtmo(ctx));
  const secVerse2 =
      merge(genLoFiDrums(ctx, 0.5), chords, bass, melody1v2, genLoFiAtmo(ctx));
  const secChorus2 = merge(
      genLoFiDrums(ctx, 1), chords, bass, melody1c, melody2, genLoFiAtmo(ctx));
  const secBridge =
      merge(genLoFiDrums(ctx, 0), bass, melody2b, genLoFiAtmo(ctx));
  const secChorus3 = merge(
      genLoFiDrums(ctx, 1), chords, bass, melody1c, melody2, genLoFiAtmo(ctx));
  const secOutro = merge(genLoFiDrums(ctx, 0), chords, bass, genLoFiAtmo(ctx));
  const secOutro2 = merge(chords, bass);

  const sections = [
    secIntro, secVerse1, secChorus1, secVerse2, secChorus2, secBridge,
    secChorus3, secOutro, secOutro2
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
