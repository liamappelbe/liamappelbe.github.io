load('SumoShip/game.js');

var game = null;

function onLoad() {
  game = new Game(
    document.getElementById('canvas'),
    document.getElementById('aiList'));
  window.addEventListener('message', onResponse, false);
  onLoop();
}

function onResize() {
  if (game) {
    game.onResize();
  }
}

function onLoop() {
  if (game) {
    game.onLoop();
  }
  window.requestAnimationFrame(onLoop);
}

function onResponse(e) {
  if (game) {
    game.onResponse(e);
  }
}

function onAddAi() {
  var param = encodeURIComponent(document.getElementById('addAiUrl').value);
  if (window.location.search.length > 0) {
    param = '&' + param;
  } else {
    param = '?' + param;
  }
  window.open(window.location.href + param, '_self');
}