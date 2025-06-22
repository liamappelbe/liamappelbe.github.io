const exports = {};
function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
function numSan(x, valueIfNaN = 0) { return isNumber(x) ? x : valueIfNaN; }

const _isLoaded = new Set();
function load(src) {
  if (_isLoaded.has(src)) return;
  _isLoaded.add(src);
  return new Promise((resolve, reject) => {
    const node = document.createElement('script');
    const hour = Math.floor(new Date().getTime() / (3.6e6));
    node.onload = resolve;
    node.src = src + '#' + hour;
    document.head.appendChild(node);
  });
}

let _allLoaded = false;
let _allLoadedCallbacks = [];
function listenOSLoaded(callback) {
  if (_allLoaded) {
    callback();
    return;
  }
  _allLoadedCallbacks.push(callback);
}
function _onAllLoaded() {
  if (_allLoaded) return;
  _allLoaded = true;
  for (callback of _allLoadedCallbacks) callback();
}

(async () => {
  await load('https://onlinesequencer.net/ajax/settings.php');
  await load('https://onlinesequencer.net/resources/google-protobuf.js');
  await Promise.all([
    load('https://onlinesequencer.net/proto/js/envelope.js'),
    load('https://onlinesequencer.net/proto/js/instrumentsettings.js'),
    load('https://onlinesequencer.net/proto/js/lfomode.js'),
    load('https://onlinesequencer.net/proto/js/lfotarget.js'),
    load('https://onlinesequencer.net/proto/js/lfotype.js'),
    load('https://onlinesequencer.net/proto/js/marker.js'),
    load('https://onlinesequencer.net/proto/js/note.js'),
    load('https://onlinesequencer.net/proto/js/notetype.js'),
    load('https://onlinesequencer.net/proto/js/sequence.js'),
    load('https://onlinesequencer.net/proto/js/sequencesettings.js'),
    load('https://onlinesequencer.net/proto/js/synth.js'),
    load('https://onlinesequencer.net/proto/js/synthtype.js'),
    load('https://onlinesequencer.net/app/instrumentManager.js'),
    load('https://onlinesequencer.net/app/consoleCommands.js'),
  ]);
  _onAllLoaded();
})();
