load("util.js");

// State -> Score
function aiHeuristic(t, s, f) {
  var v = checkVictory(s.m);
  if (v == pSelect(t, 1, 2))
    return Infinity;
  if (v == pSelect(t, 2, 1))
    return -Infinity;
  // Heuristics:
  //  - More pieces is good
  //  - Grouping up is good
  //  - Pawns near enemy master is good
  //  - Master near enemy home is good
  //  - Pawns between master and enemy is good (TODO)
  //  - More powerful cards in hand is good (TODO)
  // For each metric calculate it for us and the enemy, then add ours and
  // subtract theirs. Also, add a tiny random component, so that if everything's
  // equal we do something random.
  var ourMaster = pSelect(t, kPieceP1Master, kPieceP2Master);
  var ourPawn = pSelect(t, kPieceP1Pawn, kPieceP2Pawn);
  var theirMaster = pSelect(t, kPieceP2Master, kPieceP1Master);
  var theirPawn = pSelect(t, kPieceP2Pawn, kPieceP1Pawn);
  var h = randFloat(-f.randomFactor, f.randomFactor);
  if (f.pieceFactor != 0) {
    h += f.pieceFactor * countPieces(s.m, ourPawn);
    h -= f.pieceFactor * countPieces(s.m, theirPawn);
  }
  if (f.groupFactor != 0) {
    h += f.groupFactor * aiGroupingHeuristic(s.m, ourMaster, ourPawn);
    h -= f.groupFactor * aiGroupingHeuristic(s.m, theirMaster, theirPawn);
  }
  if (f.stoneFactor != 0) {
    h += f.stoneFactor * aiGroupingHeuristic(s.m, theirMaster, ourPawn);
    h -= f.stoneFactor * aiGroupingHeuristic(s.m, ourMaster, theirPawn);
  }
  if (f.streamFactor != 0) {
    h += f.streamFactor * aiStreamHeuristic(s.m, t);
    h -= f.streamFactor * aiStreamHeuristic(s.m, flipTurn(t));
  }
  return h;
}

function aiGroupingHeuristic(m, master, pawn) {
  var h = 0;
  var n = 0;
  var o = getPiecePos(m, master);
  if (o == null)
    return h;
  for (var i = 0; i < 5; ++i) {
    for (var j = 0; j < 5; ++j) {
      if (getMapCell(m, i, j) == pawn) {
        var di = i - o[0];
        var dj = j - o[1];
        h += di * di + dj * dj;
        ++n;
      }
    }
  }
  h /= 25; // Divide by 25 because square distance along one axis can be up
           // to 25.
  if (n)
    h /= n;
  return 1 / h; // Invert because closer is better.
}

function aiStreamHeuristic(m, t) {
  var h = 0;
  var o = getPiecePos(m, pSelect(t, kPieceP1Master, kPieceP2Master));
  if (o == null)
    return h;
  var di = 2 - o[0];
  var dj = pSelect(t, 4, 0) - o[1];
  h += di * di + dj * dj;
  h /= 25;      // Divide by 25 because square distance along one axis can be up
                // to 25.
  return 1 / h; // Invert because closer is better.
}

// Score, Score -> Score
function combineAiHeuristics(ours, recursed, f) {
  if (!isFinite(ours))
    return ours;
  recursed = -recursed;
  if (!isFinite(recursed))
    return recursed;
  return ours + f.recursiveScoreWeight * recursed;
}

// State, int -> [Move, Score]
// Scores go from -Infinity (guarunteed loss) to Infinity (guarunteed win). A
// finite value means it's a heuristic guess about how good the situation is. n
// is recursion depth, going from 0 to 3 to trade off difficulty vs computation
// time: 0: Do a move if it wins the game immediately 1: Avoid moves that give
// the enemy winning moves 2: Do a move if it gives us a winning move next turn
// 3: Avoid moves that give the enemy winning moves next turn
// 4: And so on, but at this point it's annoyingly slow to compute
function runBasicAi(s, n, f) {
  // Goal is to return the move with the highest score.
  // For each valid move:
  //  - If the move leads to immediate victory, return it (score = Infinity)
  // If n > 0, for each valid move:
  //  - Recurse with n - 1 (need to flip the inputs)
  //  - If the returned score was -Infinity, return this move (score = Infinity)
  //  - Otherwise, the score of this move is a combination of the recursed score
  //  and the
  //    score of the current state:
  //      - If the recursed score was Infinity, our score is -Infinity (skip
  //      heuristic calculation)
  //      - Otherwise our score is a weighted average of the negative recursed
  //      score and our score
  //  - Keep track of the max score and its move
  // Return the max score and its move.

  var a = []; // Array{Tuple{Move, State, Score}}
  forEachValidMove(s, m => {
    var s2 = applyMove(s, m);
    a.push([ m, s2, aiHeuristic(s.t, s2, f) ]);
  });
  assert(a.length > 0);

  for (var i = 0; i < a.length; ++i) {
    if (a[i][2] == Infinity)
      return [ a[i][0], a[i][2] ];
  }

  if (n > 0) {
    for (var i = 0; i < a.length; ++i) {
      var r = runBasicAi(a[i][1], n - 1, f);
      a[i][2] = combineAiHeuristics(a[i][2], r[1], f);
    }
  }

  var ms = a[0][2];
  var mi = 0;
  for (var i = 1; i < a.length; ++i) {
    if (a[i][2] > ms) {
      ms = a[i][2];
      mi = i;
    }
  }

  return [ a[mi][0], a[mi][2] ];
}
