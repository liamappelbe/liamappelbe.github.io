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

function drumNote(drumType, time, vol = 1, length = 0) {
  return new Note(drumType.type, time, length, drumType.inst, vol);
}

function addNoteWithTrill(notes, inst, t, vol, trillLen, trillDt, trillVol) {
  notes.push(drumNote(inst, t, vol));
  for (let i = 1; i <= trillLen; ++i) {
    notes.push(drumNote(inst, t - i * trillDt, vol * trillVol, trillDt));
  }
}
