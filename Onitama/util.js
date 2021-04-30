print = console.log;
assert = console.assert;
function ident(x) { return x; }

const kTurnP1 = 0;
const kTurnP2 = 1;

const kColorNone = 0;
const kColorRed = 1;
const kColorBlue = 2;
const kColorClasses = ["cardColorNone", "cardColorRed", "cardColorBlue"];

const kCardMoveSrc = "X";
const kCardMoveDest = "O";
const kCardMoveEmpty = " ";

const kCardMoveClasses = {
  "X": "cardMoveSrc",
  "O": "cardMoveDest",
  " ": "cardMoveEmpty",
};

const kCardData = [
  {name: "Boar", color: kColorNone, turn: kTurnP1, move: [" O ", "OXO"]},
  {name: "Elephant", color: kColorNone, turn: kTurnP1, move: ["O O", "OXO"]},
  {name: "Monkey", color: kColorNone, turn: kTurnP2, move: ["O O", " X ", "O O"]},
  {name: "Crane", color: kColorNone, turn: kTurnP2, move: [" O ", " X ", "O O"]},
  {name: "Mantis", color: kColorNone, turn: kTurnP1, move: ["O O", " X ", " O "]},
  {name: "Crab", color: kColorNone, turn: kTurnP2, move: ["  O  ", "O X O"]},
  {name: "Dragon", color: kColorNone, turn: kTurnP1, move: ["O   O", "  X  ", " O O "]},
  {name: "Tiger", color: kColorNone, turn: kTurnP2, move: ["O", " ", "X", "O"]},
  {name: "Ox", color: kColorRed, turn: kTurnP2, move: ["O ", "XO", "O "]},
  {name: "Horse", color: kColorBlue, turn: kTurnP1, move: [" O", "OX", " O"]},
  {name: "Rooster", color: kColorRed, turn: kTurnP1, move: ["  O", "OXO", "O  "]},
  {name: "Goose", color: kColorBlue, turn: kTurnP2, move: ["O  ", "OXO", "  O"]},
  {name: "Cobra", color: kColorRed, turn: kTurnP1, move: ["  O", "OX ", "  O"]},
  {name: "Eel", color: kColorBlue, turn: kTurnP2, move: ["O  ", " XO", "O  "]},
  {name: "Rabbit", color: kColorRed, turn: kTurnP2, move: ["  O ", " X O", "O   "]},
  {name: "Frog", color: kColorBlue, turn: kTurnP1, move: [" O  ", "O X ", "   O"]},
];

const kPieceP1Pawn = "a";
const kPieceP1Master = "A";
const kPieceP2Pawn = "b";
const kPieceP2Master = "B";
const kPieceNone = "_";

const kPieceClasses = {
  "a": "p1Pawn",
  "A": "p1Master",
  "b": "p2Pawn",
  "B": "p2Master",
};

function makeReverseLookup(s, getKey = ident) {
  var m = {};
  for (var i = 0; i < s.length; ++i) m[getKey(s[i])] = i;
  return m;
}

const kCardNames = makeReverseLookup(kCardData, c => c.name);

const kUrlSafeChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-._~";
const kUrlSafeCharsInv = makeReverseLookup(kUrlSafeChars);

function randInt(n) { return Math.floor(Math.random() * (n - 1)); }
function randFloat(a, b) { return Math.random() * (b - a) + a; }
function getOr(m, k, d) { return k in m ? m[k] : d; }
function getById(id) { return document.getElementById(id); }
function clearChildren(n) { while (n.lastChild) n.removeChild(n.lastChild); }
function cellNum(i, j) { return 5 * i + j; }

function newDiv(cls) {
  var e = document.createElement("div");
  e.className = cls;
  return e;
}

function getQueryParams() {
  var params = {};
  window.location.search.substr(1).split("&").forEach(p => {
    var s = p.split("=");
    params[s[0]] = s[1];
  });
  return params;
}

function arrayCopy(a) {
  b = [];
  for (var i = 0; i < a.length; ++i) b.push(a[i]);
  return b;
}

function arraySwap(a, i, j) {
  var t = a[i];
  a[i] = a[j];
  a[j] = t;
}

function arrayDel(a, i) {
  a[i] = a[a.length - 1];
  a.pop();
}

function getMapCell(m, i, j) { return m[cellNum(i, j)]; }
function setMapCellId(m, k, c) { return m.substr(0, k) + c + m.substr(k + 1); }
function setMapCell(m, i, j, c) { return setMapCellId(m, cellNum(i, j), c); }
function pSelect(t, p1, p2) { return t == kTurnP1 ? p1 : p2; }
function flipTurn(t) { return pSelect(t, kTurnP2, kTurnP1); }
function moveRows(c) { return c.move[0].length; }
function moveCols(c) { return c.move.length; }
function newMove(cn, si, sj, di, dj) { return { cn: cn, si: si, sj: sj, di: di, dj: dj }; }

function getPiecePos(m, c) {
  for (var i = 0; i < 5; ++i) {
    for (var j = 0; j < 5; ++j) {
      if (getMapCell(m, i, j) == c) return [i, j];
    }
  }
  return null;
}

function countPieces(m, p) {
  var k = 0;
  for (var i = 0; i < 5; ++i) {
    for (var j = 0; j < 5; ++j) {
      if (getMapCell(m, i, j) == p) {
        k += 1;
      }
    }
  }
  return k;
}

function checkVictory(m) {
  var p1 = getPiecePos(m, kPieceP1Master);
  var p2 = getPiecePos(m, kPieceP2Master);
  if (p1 == null) return 2;
  if (p2 == null) return 1;
  if (p1[0] == 2 && p1[1] == 4) return 1;
  if (p2[0] == 2 && p2[1] == 0) return 2;
  return 0;
}

function getCardMove(c, i, j, p) {
  var mr = c.move[pSelect(p, c.move.length - 1 - j, j)];
  return mr[pSelect(p, i, mr.length - 1 - i)];
}

function getCardMoveSrc(c, p) {
  for (var i = 0; i < moveRows(c); ++i) {
    for (var j = 0; j < moveCols(c); ++j) {
      if (getCardMove(c, i, j, p) == kCardMoveSrc) {
        return [i, j];
      }
    }
  }
  return null;
}

function isActivePiece(s, i, j) {
  c = getMapCell(s.m, i, j);
  return c == pSelect(s.t, kPieceP1Pawn, kPieceP2Pawn) || c == pSelect(s.t, kPieceP1Master, kPieceP2Master);
}

function applyMove(s, m) {
  var c = arrayCopy(s.c);
  arraySwap(c, 4, m.cn);
  return {
    c: c,
    t: flipTurn(s.t),
    m: setMapCell(setMapCell(s.m, m.di, m.dj, getMapCell(s.m, m.si, m.sj)), m.si, m.sj, "_"),
  };
}

function applyMoveWrap(g, m) {
  return {
    p1: g.p1,
    p2: g.p2,
    s: applyMove(g.s, m),
  };
}

function forEachValidMoveOfCard(s, cn, si, sj, cb) {
  var c = kCardData[s.c[cn]];
  var o = getCardMoveSrc(c, s.t);
  for (var i = 0; i < moveRows(c); ++i) {
    for (var j = 0; j < moveCols(c); ++j) {
      if (getCardMove(c, i, j, s.t) == kCardMoveDest) {
        var di = i - o[0] + si;
        var dj = j - o[1] + sj;
        if (di >= 0 && di < 5 && dj >= 0 && dj < 5 && !isActivePiece(s, di, dj)) {
          cb(newMove(cn, si, sj, di, dj));
        }
      }
    }
  }
}

function forEachActivePiece(s, cb) {
  for (var i = 0; i < 5; ++i) {
    for (var j = 0; j < 5; ++j) {
      if (isActivePiece(s, i, j)) {
        cb(i, j);
      }
    }
  }
}

function forEachValidMove(s, cb) {
  forEachActivePiece(s, (i, j) => {
    forEachValidMoveOfCard(s, pSelect(s.t, 0, 2), i, j, cb);
    forEachValidMoveOfCard(s, pSelect(s.t, 1, 3), i, j, cb);
  });
}
