function saveBlob(filename, data, type) {
  var file = new Blob(data, {type: type});
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else {
    var a = document.createElement('a');
    var url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

function protoToBlob(seq) {
  try {
    return seq.serializeBinary();
  } catch (e) {
    console.log('Serializing sequence failed', e);
    console.log(seq.toObject());
    return null;
  }
}

function genName() {
  return `The ${choose(kAdjectives)} ${choose(kColors)} ${
      choose(kAnimals)}.sequence`;
}

function finishProto(seq, code, seed) {
  if (seq != null) {
    stegWrite(seq, buildWatermark(code, seed));
  }
  return seq;
}

async function setSeqSeed(seed = null) {
  setSeed(seed);
  await setThumbImage();
}

async function generate(generator, code, seed = null) {
  if (seed !== null) await setSeqSeed(seed);
  seed = randSeed;
  console.log('Seed =', seed);
  const blob = protoToBlob(finishProto(await generator(), code, seed));
  if (!blob) {
    console.log('Generation failed');
    return;
  }
  saveBlob(genName(), [blob], 'application/octet-stream');
  await setSeqSeed();
}

async function getFileFromDialog() {
  return new Promise((resolve, reject) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.onchange = () => {
      if (inp.files == null || inp.files.length == 0) {
        reject('No file chosen');
      } else {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsArrayBuffer(inp.files[0]);
      }
    };
    inp.click();
  });
}

function marker(time, setting, inst, value, blend = false) {
  var m = new proto.Marker();
  m.setTime(noteTimeToOsFormat(time));
  m.setSetting(setting);
  m.setInstrument(inst);
  m.setValue(value);
  m.setBlend(blend);
  return m;
}

function merge(...args) {
  out = [];
  for (let i = 0; i < args.length; ++i) {
    for (const n of args[i]) out.push(n);
  }
  return out;
}

function joinBars(args) {
  out = [];
  for (let i = 0; i < args.length; ++i) {
    for (const n of args[i]) out.push(n.shift(i * kBar));
  }
  return out;
}

function joinSections(args) {
  out = [];
  for (let i = 0; i < args.length; ++i) {
    for (const n of args[i]) out.push(n.shift(i * kBar * kSection));
  }
  return out;
}

function beatEmphasis(t) {
  const kBeatRes = 8;
  const i = Math.floor(0.5 + mod(t, kBar) * kBeatRes);
  if (i == 0) return 1;
  return Math.log2(lowestSetBit(i)) / Math.log2(kBar * kBeatRes);
}

function genEmphasisEx(length, dt, p0, p1, emphCap, ot, fn) {
  for (let t = 0; t < length; t += dt) {
    const e = Math.min(1, beatEmphasis(t + ot) / emphCap);
    if (randb(lerp(p0, p1, e))) fn(t, e);
  }
}

function genEmphasisBar(p0, p1, fn) {
  return genEmphasisEx(kBar, 0.25, p0, p1, 1, 0, fn);
}

class MarkerEffect {
  constructor(t0) {
    this.t0 = t0;
    this.volumePulses = 0;  // 0, 1, 2, 3, 4
    this.eqFade = 0;  // -1, 0, 1
    this.detuneDescent = false;
    this.crossPan = false;
    this.dropDrums = false;
    this.dropMelody = false;
    this.dropChords = false;
    this.dropBass = false;
  }
}

let domThumbImage = null;
async function setThumbImage(url = null) {
  return new Promise((resolve, reject) => {
    domThumbImage.src = url ?? `https://picsum.photos/seed/${randSeed}/200`;
    const resolveOnce = () => {
      if (resolve == null) return;
      const r = resolve;
      resolve = null;
      r();
    };
    domThumbImage.onload = resolveOnce;
    window.setTimeout(resolveOnce, 10000);
  });
}

window.addEventListener('load', () => {
  domThumbImage = document.getElementById('thumb');
  setSeqSeed();
});

function genThumbNotes() {
  const notes = [];
  const options = {invis: true};
  generateThumbnail(domThumbImage, options, (type, t, len, inst) => {
    notes.push(new Note(type, t / 4, len / 4, inst, 0));
  });
  return notes;
}

async function genThumb(url = null) {
  const notes = genThumbNotes(url);
  const seq = new proto.Sequence();
  for (const note of notes) {
    const p = note.asProto;
    if (p !== null) seq.addNotes(p);
  }
  return seq;
}
