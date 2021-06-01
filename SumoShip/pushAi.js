function onLoad() {
  if (window.location.hash.length == 0) {
    window.location.hash = '#cacheBusted';
    window.location.reload(true);
  }
  window.addEventListener('message', onCtrlRequest, false);
}

function onCtrlRequest(e) {
  var s1 = e.data.indexOf(',');
  var s2 = e.data.indexOf(',', s1 + 1);
  var token = e.data.substr(0, s1);
  var i = parseInt(e.data.substr(s1 + 1, s2));
  var s = JSON.parse(e.data.substr(s2 + 1, e.data.length));
  var c = getCtrl(i, s);
  e.source.postMessage(token + ',' + c[0] + ',' + c[1], e.origin);
}

function log(msg) {
  document.getElementById('log').innerHTML = msg;
}

function clamp(x, lo, hi) {
  return x <= lo ? lo : x >= hi ? hi : x;
}

function getCtrl(i, state) {
  if (!state.ships[i].alive) return [0, 0];
  var y = -100 * (state.ships[i].p.y + 0.8 * state.ships[i].v.y);
  var x = 0.2 * (state.ships[i].p.x + 3 * state.ships[i].v.x);
  var t = 0.5 * (10 * (state.ships[i].r - x) + 3 * state.ships[i].w);
  var l = clamp(clamp(y, 0, 1) + clamp(t, -1, 1), 0, 1);
  var r = clamp(clamp(y, 0, 1) - clamp(t, -1, 1), 0, 1);
  log(Math.floor(l * 10000) + '<br>' + Math.floor(r * 10000));
  return [l, r];
}
