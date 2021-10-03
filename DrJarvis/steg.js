const castF32Buffer = new Float32Array(1);
const castU32Buffer = new Uint32Array(castF32Buffer.buffer);
function castF32ToU32(x) {
  castF32Buffer[0] = x;
  return castU32Buffer[0];
}
function castU32ToF32(x) {
  castU32Buffer[0] = x;
  return castF32Buffer[0];
}

function forEachFloatInInstumentSettings(s, fn) {
  s.setVolume(fn(s.getVolume()));
  s.setOneMinusReverbVolume(fn(s.getOneMinusReverbVolume()));
  s.setPan(fn(s.getPan()));
  s.setEqLow(fn(s.getEqLow()));
  s.setEqMid(fn(s.getEqMid()));
  s.setEqHigh(fn(s.getEqHigh()));
  s.setDetune(fn(s.getDetune()));
}

function forEachFloatInSequenceSettings(ss, fn) {
  if (!ss) return;
  ss.setOneMinusVolume(fn(ss.getOneMinusVolume()));
  for (const [i, s] of ss.getInstrumentsMap().entries()) {
    forEachFloatInInstumentSettings(s, fn);
  }
}

function forEachFloatInNote(n, fn) {
  n.setTime(fn(n.getTime()));
  n.setLength(fn(n.getLength()));
  n.setVolume(fn(n.getVolume()));
}

function forEachFloatInMarker(m, fn) {
  m.setTime(fn(m.getTime()));
  m.setValue(fn(m.getValue()));
}

function forEachFloatInSequence(seq, fn) {
  forEachFloatInSequenceSettings(seq.getSettings(), fn);
  for (const n of seq.getNotesList()) forEachFloatInNote(n, fn);
  for (const m of seq.getMarkersList()) forEachFloatInMarker(m, fn);
}

function stegWrite(seq, bytes) {
  let i = 0;
  forEachFloatInSequence(seq, x => {
    const y = castU32ToF32((castF32ToU32(x) & 0xFFFFFF00) | bytes[i]);
    i = (i + 1) % bytes.length;
    return y;
  });
}

function stegRead(seq) {
  const bytes = [];
  forEachFloatInSequence(seq, x => {
    bytes.push(castF32ToU32(x) & 0xFF);
    return x;
  });
  return bytes;
}

function asciiToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; ++i) bytes.push(str.charCodeAt(i));
  return bytes;
}

function bytesToAscii(bytes) {
  let str = '';
  for (let i = 0; i < bytes.length; ++i) str += String.fromCharCode(bytes[i]);
  return str;
}

const kEpoch2020Ms = Date.UTC(2020, 0, 0, 0, 0, 0);
function encodeDate(epochMs) {
  return BigInt(Math.floor((epochMs - kEpoch2020Ms) / 1000));
}
function decodeDate(watermarkTimestamp) {
  return Number(watermarkTimestamp) * 1000 + kEpoch2020Ms;
}

function pushBigInt(bytes, n, i) {
  while (n > 0 || i > 0) {
    bytes.push(Number(n & 0xFFn));
    n >>= 8n;
    --i;
  }
}

const kWatermarkMagicString = 'DrJarvis';
function buildWatermark(code, seed) {
  const bytes = asciiToBytes(kWatermarkMagicString + code);
  pushBigInt(bytes, seed, 16);
  console.assert(bytes.length == 25);  // Seed not allowed to overflow.
  pushBigInt(bytes, encodeDate(Date.now()), 0);
  return bytes;
}

function parseBigInt(bytes, start, stop) {
  let x = 0n;
  for (let i = stop - 1; i >= start; --i) {
    x <<= 8n;
    x |= BigInt(bytes[i]);
  }
  return x;
}

function parseWatermark(bytes) {
  const pre = asciiToBytes(kWatermarkMagicString);
  for (let i = 0; i < pre.length; ++i) {
    if (pre[i] != bytes[i]) return null;
  }
  const code = String.fromCharCode(bytes[pre.length]);
  const seed = parseBigInt(bytes, pre.length + 1, pre.length + 17);
  const time =
      new Date(decodeDate(parseBigInt(bytes, pre.length + 17, bytes.length)));
  return [code, seed, time];
}

function findBytes(bytes, pre, start) {
  for (let i = start; i < bytes.length; ++i) {
    let found = true;
    for (let j = 0; j < pre.length; ++j) {
      const k = i + j;
      if (k >= bytes.length || bytes[k] != pre[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return bytes.length;
}

function stegParse(seq) {
  const bytes = stegRead(seq);
  const pre = asciiToBytes(kWatermarkMagicString);
  const db = new Map();
  function add(l, r) {
    const key = parseBigInt(bytes, l, r);
    if (!db.has(key)) {
      db.set(key, {
        bytes: bytes.slice(l, r),
        count: 1,
      });
    } else {
      ++db.get(key).count;
    }
  }
  let l = 0;
  while (true) {
    const r = findBytes(bytes, pre, l + 1);
    add(l, r);
    if (r >= bytes.length) break;
    l = r;
  }
  let mc = 0;
  let mp = null;
  let sum = 0;
  for (const v of db.values()) {
    sum += v.count;
    if (v.count > mc) {
      const p = parseWatermark(v.bytes);
      if (p != null) {
        mc = v.count;
        mp = p;
      }
    }
  }
  if (mp == null) return null;
  return [mp[0], mp[1], mp[2], mc / sum];
}
