load('SumoShip/keypress.js');

var L = window.location.search.charAt(1).toLowerCase();
var R = window.location.search.charAt(2).toLowerCase();
var keyListener = null;
var lkey = false;
var rkey = false;

function onLoad() {
  setLog();
  keyListener = new window.keypress.Listener();
  keyListener.register_combo({
    keys: L, on_keydown: onLeftDown, on_keyup: onLeftUp});
  keyListener.register_combo({
    keys: R, on_keydown: onRightDown, on_keyup: onRightUp});
  window.addEventListener('message', onCtrlRequest, false);
}

function onLeftDown() {
  lkey = true;
  setLog();
}

function onLeftUp() {
  lkey = false;
  setLog();
}

function onRightDown() {
  rkey = true;
  setLog();
}

function onRightUp() {
  rkey = false;
  setLog();
}

function onCtrlRequest(e) {
  var token = e.data.split(',')[0];
  e.source.postMessage(
    token + ',' + (lkey ? '1' : '0') + ',' + (rkey ? '1' : '0'), e.origin);
}

function setLog() {
  document.getElementById('log').innerHTML =
    (lkey ? '|' : ' ') + L.toUpperCase() + (lkey ? '|' : ' ') + ' ' +
    (rkey ? '|' : ' ') + R.toUpperCase() + (rkey ? '|' : ' ');
}