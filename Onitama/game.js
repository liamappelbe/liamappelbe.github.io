load("ai/core.js");
load("ai/list.js");
load("util.js");

function getCard(p, n) { return getById("p" + pSelect(p, "1", "2") + "Card" + n); }
function clearCard(p, n) { clearChildren(getCard(p, n)); }
function getBoardCell(i, j) { return getById("board").children[i].children[j]; }
function getBoardPiece(i, j) { return getOrCreateChild(getBoardCell(i, j), "piece"); }
function setBoardMoveDest(i, j) { getOrCreateChild(getBoardCell(i, j), "moveDest"); }
function removeBoardMoveDest(i, j) { removeChild(getBoardCell(i, j), "moveDest"); }
function setHoverable(e) { e.classList.add("hoverable"); }
function setSelected(e) { e.classList.add("selected"); }
function setNotSelected(e) { e.classList.remove("selected"); }
function newSvgNode(kind) { return document.createElementNS("http://www.w3.org/2000/svg", kind); }
function getActiveCardIndex(s, n) { return pSelect(s.t, n - 1, n + 1); }

function encodeNumbers(a, b, m) {
  var j0 = a.length;
  for (var i = 0; i < b.length; ++i) {
    var k = b[i];
    assert(k < m);
    for (var j = j0; j < a.length; ++j) {
      var pk = a[j][1];
      assert(k != pk);
      if (k > pk) --k;
    }
    assert(k < m - i);
    a.push([m - i, k]);
  }
}

function decodeNumbers(a, a0, n) {
  var b = [];
  for (var i = 0; i < n; ++i) {
    var jn = a0 + i;
    var k = a[jn];
    for (var j = jn - 1; j >= a0; --j) {
      if (k >= a[j]) ++k;
    }
    b.push(k);
  }
  return b;
}

function encodeMapNumbers(a, b, m, p, n) {
  var k = 0;
  for (var i = 0; i < 5; ++i) {
    for (var j = 0; j < 5; ++j) {
      if (getMapCell(m, i, j) == p) {
        b.push(cellNum(i, j));
        k += 1;
      }
    }
  }
  assert(k < n);
  a.push([n, k]);
}

function decodeMapNumbers(mb, s, p, i0, n) {
  for (var i = 0; i < n; ++i) {
    s.m = setMapCellId(s.m, mb[i0 + i], p);
  }
  return i0 + n;
}

var kAiNamesLower = null;
function getAiNames() {
  if (kAiNamesLower == null) kAiNamesLower = kAiList.map(s => s.toLowerCase());
  return kAiNamesLower;
}
function getAiName(i) {
  return getAiNames()[i];
}

var kReverseAiMap = null;
function getAiId(aiName) {
  if (kReverseAiMap == null) kReverseAiMap = makeReverseLookup(getAiNames());
  return kReverseAiMap[aiName];
}

function stateToNumbers(g) {
  /*[
    p1,
    p2,
    turn,
    cards...,
    numP1Pawns,
    numP1Masters,
    numP2Pawns,
    numP2Masters,
    p1Pawns...,
    p1Masters...,
    p2Pawns...,
    p2Masters...
  ]*/
  var a = [];
  a.push([kAiList.length, getAiId(g.p1)]);
  a.push([kAiList.length, getAiId(g.p2)]);
  var s = g.s;
  a.push([2, pSelect(s.t, 0, 1)]);
  encodeNumbers(a, s.c, kCardData.length);
  var mb = [];
  encodeMapNumbers(a, mb, s.m, "a", 5);
  encodeMapNumbers(a, mb, s.m, "A", 2);
  encodeMapNumbers(a, mb, s.m, "b", 5);
  encodeMapNumbers(a, mb, s.m, "B", 2);
  encodeNumbers(a, mb, 25);
  return a;
}

function stateRadixGenerator(a) {
  if (a.length <= 1) return kAiList.length;
  if (a.length == 2) return 2;
  if (a.length <= 7) return kCardData.length + 3 - a.length;
  if (a.length == 8) return 5;
  if (a.length == 9) return 2;
  if (a.length == 10) return 5;
  if (a.length == 11) return 2;
  return 37 - a.length;
}

function numbersToState(a) {
  var p1 = getAiName(a[0]);
  var p2 = getAiName(a[1]);
  var t = a[2] == 0 ? kTurnP1 : kTurnP2;
  c = decodeNumbers(a, 3, 5);
  var s = {
    c: c,
    t: t,
    m: "_________________________",
  };
  var p1Pawns = a[8];
  var p1Masters = a[9];
  var p2Pawns = a[10];
  var p2Masters = a[11];
  var mb = decodeNumbers(a, 12, p1Pawns + p1Masters + p2Pawns + p2Masters);
  var i = decodeMapNumbers(mb, s, "a", 0, p1Pawns);
  i = decodeMapNumbers(mb, s, "A", i, p1Masters);
  i = decodeMapNumbers(mb, s, "b", i, p2Pawns);
  i = decodeMapNumbers(mb, s, "B", i, p2Masters);
  return {
    p1: p1,
    p2: p2,
    s: s,
  };
}

function numbersToString(a) {
  u = "";
  var k = 0;
  var r = kUrlSafeChars.length;
  for (var i = a.length - 1; i >= 0; --i) {
    k *= a[i][0];
    k += a[i][1];
    while (k >= r) {
      u = u + kUrlSafeChars[k % r];
      k = Math.floor(k / r);
    }
  }
  assert(k < r);
  u = u + kUrlSafeChars[k];
  return u;
}

function stringToNumbers(u, stateRadixGenerator) {
  var a = [];
  var r = stateRadixGenerator(a);
  var k = 0;
  for (var i = u.length - 1; i >= 0; --i) {
    k *= kUrlSafeChars.length;
    k += kUrlSafeCharsInv[u[i]];
    while (k >= r) {
      a.push(k % r);
      k = Math.floor(k / r);
      r = stateRadixGenerator(a);
    }
  }
  assert(k < r);
  a.push(k);
  return a;
}

function encodeState(g) { return numbersToString(stateToNumbers(g)); }
function decodeState(u) { return numbersToState(stringToNumbers(u, stateRadixGenerator)); }

function newTextSvg(text) {
  var s = newSvgNode("svg");
  s.setAttribute("viewBox", "0 0 200 40");
  var t = newSvgNode("text");
  t.setAttribute("x", "100");
  t.setAttribute("y", "30");
  t.setAttribute("text-anchor", "middle");
  t.appendChild(document.createTextNode(text));
  s.appendChild(t);
  return s;
}

function pickFrom(n, m) {
  var a = [];
  while (a.length < m) a.push(a.length);
  var b = [];
  for (var i = 0; i < n; ++i) {
    var j = randInt(a.length);
    b.push(a[j]);
    arrayDel(a, j);
  }
  return b;
}

function newState(cards) {
  if (cards == null) cards = pickFrom(5, kCardData.length);
  return {
    c: cards,
    t: kCardData[cards[cards.length - 1]].turn,
    m: "a___ba___bA___Ba___ba___b",
  };
}

function cardNamesToIds(names) {
  if (names == null) return null;
  return names.split(",").map(x => kCardNames[x]);
}

function getGameStateFromUrl() {
  var s = window.location.search;
  if (s.length > 5 && s.indexOf("=") == -1) {
    return decodeState(s.substr(1));
  } else {
    var params = getQueryParams();
    return {
      p1: getOr(params, "p1", getAiName(0)),
      p2: getOr(params, "p2", getAiName(0)),
      s: newState(cardNamesToIds(getOr(params, "cards", null))),
    };
  }
}

function setUrlFromGameState(g) {
  var ss = "?" + encodeState(g);
  if (window.location.search != ss) {
    window.location.search = ss;
  }
}

function renderVictory(v) {
  var e = newDiv("p" + v + "Victory victory");
  var t = newTextSvg("Player " + v + " wins!");
  e.appendChild(t);
  getById("inner").appendChild(e);
}

function renderState(s) {
  renderCards(s.c, s.t);
  renderMap(s.m);
  var v = checkVictory(s.m);
  if (v) {
    renderVictory(v);
    return false;
  }
  return true;
}

function renderCard(ci, p, n) {
  var c = kCardData[ci];
  var moves = newDiv("cardMoves");
  for (var i = 0; i < moveRows(c); ++i) {
    var row = newDiv("cardMovesRow");
    for (var j = 0; j < moveCols(c); ++j) {
      var k = getCardMove(c, i, j, p);
      row.appendChild(newDiv("cardMove " + kCardMoveClasses[k]));
    }
    moves.appendChild(row);
  }
  var cardWrap = newDiv("cardWrap " + kColorClasses[c.color]);
  cardWrap.appendChild(newTextSvg(c.name));
  cardWrap.appendChild(moves);
  var card = getCard(p, n);
  clearChildren(card);
  card.appendChild(cardWrap);
}

function renderCards(c, t) {
  renderCard(c[0], kTurnP1, 1);
  renderCard(c[1], kTurnP1, 2);
  renderCard(c[2], kTurnP2, 1);
  renderCard(c[3], kTurnP2, 2);
  renderCard(c[4], t, 3);
  clearCard(flipTurn(t), 3);
}

function getChild(e, cls) {
  for (var i = 0; i < e.children.length; ++i) {
    var c = e.children[i];
    if (c.classList.contains(cls)) return c;
  }
  return null;
}

function getOrCreateChild(e, cls) {
  var c = getChild(e, cls);
  if (c === null) {
    c = newDiv(cls);
    e.appendChild(c);
  }
  return c;
}

function removeChild(e, cls) {
  var c = getChild(e, cls);
  if (c !== null) e.removeChild(c);
}

function renderMap(m) {
  for (var i = 0; i < 5; ++i) {
    for (var j = 0; j < 5; ++j) {
      var cls = kPieceClasses[getMapCell(m, i, j)];
      if (cls) getBoardPiece(i, j).classList.add(cls);
    }
  }
}

var selectedCard = null;
function setSelectedCard(p, n) {
  selectedCard = n;
  setSelected(getCard(p, n));
  setNotSelected(getCard(p, 3 - n));
}

var selectedPieceI = null;
var selectedPieceJ = null;
function setSelectedPiece(ci, cj) {
  selectedPieceI = ci;
  selectedPieceJ = cj;
  for (var i = 0; i < 5; ++i) {
    for (var j = 0; j < 5; ++j) {
      ((i == ci && j == cj) ? setSelected : setNotSelected)(getBoardCell(i, j));
    }
  }
}

function setMoveDestClickHandler(c, g, m) {
  c.onclick = function() {
    setUrlFromGameState(applyMoveWrap(g, m));
  };
}

function maybeShowDests(g) {
  if (selectedCard !== null && selectedPieceI !== null && selectedPieceJ !== null) {
    for (var i = 0; i < 5; ++i) {
      for (var j = 0; j < 5; ++j) {
        if (!isActivePiece(g.s, i, j)) {
          removeBoardMoveDest(i, j);
          getBoardCell(i, j).onclick = null;
        }
      }
    }
    var cn = getActiveCardIndex(g.s, selectedCard);
    forEachValidMoveOfCard(g.s, cn, selectedPieceI, selectedPieceJ, (move) => {
      setBoardMoveDest(move.di, move.dj);
      setMoveDestClickHandler(getBoardCell(move.di, move.dj), g, move);
    });
  }
}

function setUpCardInterface(g, n) {
  var card = getCard(g.s.t, n);
  setHoverable(card);
  card.onclick = function() {
    setSelectedCard(g.s.t, n);
    maybeShowDests(g);
  };
}

function setUpPieceInterface(g, i, j) {
  var c = getMapCell(g.s.m, i, j);
  if (c == pSelect(g.s.t, "a", "b") || c == pSelect(g.s.t, "A", "B")) {
    var cell = getBoardCell(i, j);
    setHoverable(cell);
    cell.onclick = function() {
      setSelectedPiece(i, j);
      maybeShowDests(g);
    };
  }
}

function setUpHumanInterface(g) {
  setUpCardInterface(g, 1);
  setUpCardInterface(g, 2);
  for (var i = 0; i < 5; ++i) {
    for (var j = 0; j < 5; ++j) {
      setUpPieceInterface(g, i, j);
    }
  }
}

function setUpAi(g) {
  var aiName = pSelect(g.s.t, g.p1, g.p2);
  load("ai/" + aiName + ".js").addEventListener("load", function() {
    var move = globalThis["runAi_" + aiName](g.s);
    print(g, move);
    setUrlFromGameState(applyMoveWrap(g, move));
  });
}

var mainHasRun = false;
function main() {
  if (mainHasRun) return;
  mainHasRun = true;
  var g = getGameStateFromUrl();
  setUrlFromGameState(g);
  if (!renderState(g.s)) return;
  if (pSelect(g.s.t, g.p1, g.p2) == "human") {
    setUpHumanInterface(g);
  } else {
    setUpAi(g);
  }
}

window.addEventListener("load", main);
