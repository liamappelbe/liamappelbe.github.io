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

  var x = state.ships[i].p.x + state.ships[i].v.x;
  var y = -1 + state.ships[i].p.y + state.ships[i].v.y;
  var r = state.ships[i].r;

  var dx = x * Math.sin(r);
  var dy = y * -Math.cos(r);

  var l = dx + dy + 0.5;
  var r = dx + dy - 0.5;
  return [100 * l, 100 * r];
}