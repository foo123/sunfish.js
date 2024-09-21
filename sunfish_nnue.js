/**
*  sunfish.js
*  JavaScript port of Sunfish Python Chess Engine
*  @VERSION: sunfish nnue
*  https://github.com/foo123/sunfish.js
*
**/
!function(root, name, factory) {
"use strict";
if ('object' === typeof exports)
    // CommonJS module
    module.exports = factory();
else if ('function' === typeof define && define.amd)
    // AMD. Register as an anonymous module.
    define(function(req) {return factory();});
else
    root[name] = factory();
}('undefined' !== typeof self ? self : this, 'sunfish_nnue', function(undef) {
"use strict";

// utils
function* count(start=0, step=1)
{
    //# count(10) → 10 11 12 13 14 ...
    //# count(2.5, 0.5) → 2.5 3.0 3.5 ...
    let n = start;
    while (true)
    {
        yield n;
        n += step;
    }
}
function* range(start, end=0, step=1)
{
    if (1 === arguments.length)
    {
        end = start;
        start = 0;
        step = 1;
    }
    const count = Math.floor((end-start)/step);
    let i = 0;
    while (i < count)
    {
        yield start + i*step;
        ++i;
    }
}
function islower(c)
{
    return c === c.toLowerCase() && c !== c.toUpperCase();
}
function isupper(c)
{
    return c === c.toUpperCase() && c !== c.toLowerCase();
}
const SPACE = /\s/;
function isspace(c)
{
    return SPACE.test(c);
}
const ALPHA = /[a-zA-Z]/;
function isalpha(c)
{
    return ALPHA.test(c);
}
function _swapcase(c)
{
    return c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase();
}
function swapcase(s)
{
    return s.map(_swapcase);
}
function mat(r, c, v=0)
{
    const m = new Array(r);
    for (let i=0; i<r; ++i) m[i] = c ? Array(c).fill(v) : v;
    return m;
}
function matmul(a, b, i10=0, i11=-1, j10=0, j11=-1, i20=0, i21=-1, j20=0, j21=-1)
{
    let r1 = a.length, c1 = r1 && Array.isArray(a[0]) ? a[0].length : 0;
    let r2 = b.length, c2 = r2 && Array.isArray(b[0]) ? b[0].length : 0;
    const vector1 = !c1, vector2 = !c2;
    if (vector1 && vector2)
    {
        if (i21===i20)
        {
            c2 = r2;
            r2 = 1;
        }
        else
        {
            c2 = 1;
        }
        if (i11===i10)
        {
            c1 = r1;
            r1 = 1;
        }
        else
        {
            c1 = 1;
        }
    }
    else if (vector1)
    {
        if (i21===i20)
        {
            c1 = 1;
        }
        else
        {
            c1 = r1;
            r1 = 1;
        }
    }
    else if (vector2)
    {
        if (j11===j10)
        {
            c2 = r2;
            r2 = 1;
        }
        else
        {
            c2 = 1;
        }
    }
    i11 += 0 > i11 ? r1 : 0;
    j11 += 0 > j11 ? c1 : 0;
    i21 += 0 > i21 ? r2 : 0;
    j21 += 0 > j21 ? c2 : 0;
    if (j11-j10+1 !== i21-i20+1) throw "matmul dims not match: "+([i11-i10+1,j11-j10+1,i21-i20+1,j21-j20+1].join(','));
    const n = i11-i10+1, m = j21-j20+1, l = j11-j10+1;
    const c = new Array(n);
    for (let i=0; i<n; ++i)
    {
        c[i] = new Array(m);
        for (let j=0; j<m; ++j)
        {
            let cij = 0;
            for (let k=0; k<l; ++k)
            {
                cij += (vector1 ? a[k+i10] : a[i+i10][k+j10])*(vector2 ? b[k+i20] : b[k+i20][j+j20]);
            }
            c[i][j] = cij;
        }
    }
    return c;
}
function matadd(a, b, factor=1, i10=0, i11=-1, j10=0, j11=-1, i20=0, i21=-1, j20=0, j21=-1)
{
    let r1 = a.length, c1 = r1 && Array.isArray(a[0]) ? a[0].length : 0;
    let r2 = b.length, c2 = r2 && Array.isArray(b[0]) ? b[0].length : 0;
    const vector1 = !c1, vector2 = !c2;
    if (vector1) {c1 = 1;}
    if (vector2) {c2 = 1;}
    i11 += 0 > i11 ? r1 : 0;
    j11 += 0 > j11 ? c1 : 0;
    i21 += 0 > i21 ? r2 : 0;
    j21 += 0 > j21 ? c2 : 0;
    let rs1 = i11-i10+1, cs1 = j11-j10+1, rs2 = i21-i20+1, cs2 = j21-j20+1;
    if ((rs1 !== rs2) || (cs1 !== cs2)) throw "matadd dims not match: "+([rs1, cs1, rs2, cs2].join(','));
    const n = i11-i10+1, m = j21-j20+1;
    const c = new Array(n);
    if (vector1 && vector2)
    {
        for (let i=0; i<n; ++i)
        {
            c[i] = a[i+i10]+factor*b[i+i20];
        }
    }
    else
    {
        for (let i=0; i<n; ++i)
        {
            c[i] = new Array(m);
            for (let j=0; j<m; ++j)
            {
                c[i][j] = (vector1 ? a[i+i10] : a[i+i10][j+j10])+factor*(vector2 ? b[i+i20] : b[i+i20][j+j20]);
            }
        }
    }
    return c;
}
function matfunc(f, m, i0=0, i1=-1, j0=0, j1=-1)
{
    let r = m.length, c = r && Array.isArray(m[0]) ? m[0].length : 0;
    const vector = !c;
    let fm = null;
    if (vector)
    {
        if (i0 === i1)
        {
            j1 += 0 > j1 ? r : 0;
            let c2 = j1-j0+1;
            fm = new Array(c2);
            for (let j=0; j<c2; ++j) fm[j] = f(m[j+j0]);
        }
        else
        {
            i1 += 0 > i1 ? r : 0;
            let r2 = i1-i0+1;
            fm = new Array(r2);
            for (let i=0; i<r2; ++i) fm[i] = f(m[i+i0]);
        }
    }
    else
    {
        i1 += 0 > i1 ? r : 0;
        j1 += 0 > j1 ? c : 0;
        let r2 = i1-i0+1, c2 = j1-j0+1;
        fm = new Array(r2);
        for (let i=0; i<r2; ++i)
        {
            fm[i] = new Array(c2);
            for (let j=0; j<c2; ++j)
            {
                fm[i][j] = f(m[i+i0][j+j0]);
            }
        }
    }
    return fm;
}

//-------------------------------------------------------------------------------------------------
const sunfish = {version:"sunfish nnue"};

//# Mate value must be greater than 8*queen + 2*(rook+knight+bishop)
//# King value is set to twice this value such that if the opponent is
//# 8 queens up, but we got the king, we still exceed MATE_VALUE.
const MATE = 100000;
const MATE_LOWER = Math.floor(MATE / 2);
const MATE_UPPER = Math.floor(MATE * 3 / 2);
//# Since move ordering uses the lower-case version, we need to include the
//# mate score in it, since otherwise we wouldn't find checks in QS search.

// NNUE parameters and PSTs
let scale = 1.0, layer1 = null, layer2 = null, pst = null;

function features(board)
{
    const wf = mat(10, 0, 0), bf = mat(10, 0, 0);
    for (let i of range(board.length))
    {
        let p = board.charAt(i);
        if (!isalpha(p)) continue;
        let q = _swapcase(p);
        let pstp = pst[p][i], pstq = pst[q][119 - i];
        for (let j=0; j<10; ++j)
        {
            wf[j] += pstp[j];
            bf[j] += pstq[j];
        }
    }
    return [wf, bf];
}

//###############################################################################
//# Global constants
//###############################################################################

//# Our board is represented as a 120 character string. The padding allows for
//# fast detection of moves that don't stay within the board.
const A1 = 91, H1 = 98, A8 = 21, H8 = 28;
const initial = [
     "         \n"  //#   0 -  9
    ,"         \n"  //#  10 - 19
    ," rnbqkbnr\n"  //#  20 - 29
    ," pppppppp\n"  //#  30 - 39
    ," ........\n"  //#  40 - 49
    ," ........\n"  //#  50 - 59
    ," ........\n"  //#  60 - 69
    ," ........\n"  //#  70 - 79
    ," PPPPPPPP\n"  //#  80 - 89
    ," RNBQKBNR\n"  //#  90 - 99
    ,"         \n"  //# 100 -109
    ,"         \n"  //# 110 -119
].join('');

//# Lists of possible moves for each piece type.
const N = -10, E = 1, S = 10, W = -1;
const directions = {
    "P": [N, N+N, N+W, N+E],
    "N": [N+N+E, E+N+E, E+S+E, S+S+E, S+S+W, W+S+W, W+N+W, N+N+W],
    "B": [N+E, S+E, S+W, N+W],
    "R": [N, E, S, W],
    "Q": [N, E, S, W, N+E, S+E, S+W, N+W],
    "K": [N, E, S, W, N+E, S+E, S+W, N+W]
};

//# Constants for tuning search
const EVAL_ROUGHNESS = 13;

/*const opt_ranges = {
    'EVAL_ROUGHNESS': [0, 50]
};*/


//###############################################################################
//# Chess logic
//###############################################################################

function Move(i, j, prom)
{
    const self = this;
    self.i = i;
    self.j = j;
    self.prom = prom;
}
Move.prototype = {
    constructor: Move,
    i: null,
    j: null,
    prom: null
};

function Position(board, score, wf, bf, wc, bc, ep, kp)
{
    //# The state of a chess game
    //# board -- a 120 char representation of the board
    //# score -- the board evaluation
    //# turn
    //# wf -- our features
    //# bf -- opponent features
    //# wc -- the castling rights, [west/queen side, east/king side]
    //# bc -- the opponent castling rights, [west/king side, east/queen side]
    //# ep - the en passant square
    //# kp - the king passant square
    const self = this;
    self.board = board;
    self.score = score;
    self.wf = wf;
    self.bf = bf;
    self.wc = wc;
    self.bc = bc;
    self.ep = ep;
    self.kp = kp;
    self.stack = null;//[];
}
Position.prototype = {
    constructor: Position,
    board: null,
    score: null,
    wf: null,
    bf: null,
    wc: null,
    bc: null,
    ep: null,
    kp: null,
    stack: null,
    _h: null,
    gen_moves: function*() {
        //# For each of our pieces, iterate through each possible 'ray' of moves,
        //# as defined in the 'directions' map. The rays are broken e.g. by
        //# captures or immediately in case of pieces such as knights.
        const self = this;
        for (let i of range(self.board.length))
        {
            let p = self.board.charAt(i);
            if (!isupper(p))
            {
                continue;
            }
            for (let d of directions[p])
            {
                for (let j of count(i + d, d))
                {
                    let q = self.board.charAt(j);
                    //# Stay inside the board, and off friendly pieces
                    if (isspace(q) || isupper(q))
                    {
                        break;
                    }
                    //# Pawn move, double move and capture
                    if (p === "P")
                    {
                        //# If the pawn moves forward, it has to not hit anybody
                        if (-1 < [N, N + N].indexOf(d) && q !== ".")
                        {
                            break;
                        }
                        //# If the pawn moves forward twice, it has to be on the first row
                        //# and it has to not jump over anybody
                        if (d === N + N && (i < A1 + N || self.board.charAt(i + N) !== "."))
                        {
                            break;
                        }
                        //# If the pawn captures, it has to either be a piece, an
                        //# enpassant square, or a moving king.
                        if (
                            -1 < [N + W, N + E].indexOf(d)
                            && q === "."
                            && -1 === [self.ep, self.kp, self.kp - 1, self.kp + 1].indexOf(j)
                            //#and j != self.ep and abs(j - self.kp) >= 2
                        )
                        {
                            break;
                        }
                        //# If we move to the last row, we can be anything
                        if (A8 <= j && j <= H8)
                        {
                            for (let prom of ["N","B","R","Q"])
                            {
                                yield new Move(i, j, prom);
                            }
                            break;
                        }
                    }
                    //# Move it
                    yield new Move(i, j, "");
                    //# Stop crawlers from sliding, and sliding after captures
                    if (-1 < "PNK".indexOf(p) || islower(q))
                    {
                        break;
                    }
                    //# Castling, by sliding the rook next to the king. This way we don't
                    //# need to worry about jumping over pieces while castling.
                    //# We don't need to check for being a root, since if the piece starts
                    //# at A1 and castling queen side is still allowed, it must be a rook.
                    if (i === A1 && self.board.charAt(j + E) === "K" && self.wc[0])
                    {
                        yield new Move(j + E, j + W, "");
                    }
                    if (i === H1 && self.board.charAt(j + W) === "K" && self.wc[1])
                    {
                        yield new Move(j + W, j + E, "");
                    }
                }
            }
        }
    },
    rotate: function(nullmove=false) {
        //"""Rotates the board, preserving enpassant, unless nullmove"""
        const self = this;
        const pos = new Position(
            swapcase(self.board.split('').reverse()).join(''),
            0, self.bf, self.wf,
            self.bc, self.wc,
            nullmove || !self.ep ? 0 : 119 - self.ep,
            nullmove || !self.kp ? 0 : 119 - self.kp
        );
        pos.score = pos.compute_value();
        return pos;
    },
    put: function(i, p, stack=null) {
        const self = this;
        const q = self.board.charAt(i);
        //# TODO: I could update a zobrist hash here as well...
        //# Then we are really becoming a real chess program...
        self.board = self.board.slice(0, i) + p + self.board.slice(i+1);
        //self.wf.add(pst[p].pick(i).subtract(pst[q].pick(i)), false);
        //self.bf.add(pst[_swapcase(p)].pick(119 - i).subtract(pst[_swapcase(q)].pick(119 - i)), false);
        //self.wf = matadd(self.wf, matadd(pst[p][i], pst[q][i], -1, 0, -1, 0, 0, 0, -1, 0, 0), 1, 0, -1, 0, 0, 0, -1, 0, 0);
        //self.bf = matadd(self.bf, matadd(pst[_swapcase(p)][119 - i], pst[_swapcase(q)][119 - i], -1, 0, -1, 0, 0, 0, -1, 0, 0), 1, 0, -1, 0, 0, 0, -1, 0, 0);
        const pstp = pst[p][i],
            pstq = pst[q][i],
            pstb = pst[_swapcase(p)][119 - i],
            pstd = pst[_swapcase(q)][119 - i];
        for (let j=0; j<10; ++j)
        {
            self.wf[j] += pstp[j] - pstq[j];
            self.bf[j] += pstb[j] - pstd[j];
        }
        if (stack) /*self.*/stack.push([i, q]);
    },
    move: function(move) {
        const self = this;
        let {i, j, pr} = move;
        let p = self.board.charAt(i);
        let q = self.board.charAt(j);
        //# We make this stack to keep track of what we change
        let stack = [];

        let old_ep = self.ep, old_kp = self.kp, old_wc = self.wc, old_bc = self.bc;
        self.ep = 0;
        self.kp = 0;

        //# Actual move
        self.put(j, p, stack);
        self.put(i, ".", stack);

        //# Castling rights, we move the rook or capture the opponent's
        if (i === A1) self.wc = [false, self.wc[1]];
        if (i === H1) self.wc = [self.wc[0], false];
        if (j === A8) self.bc = [self.bc[0], false];
        if (j === H8) self.bc = [false, self.bc[1]];

        //# Capture the moving king. Actually we get an extra free king. Same thing.
        if (Math.abs(j - self.kp) < 2)
        {
            self.put(self.board.indexOf('k'), ' ');
        }

        //# Castling
        if (p === "K")
        {
            self.wc = [false, false];
            if (Math.abs(j - i) === 2)
            {
                self.kp = (i + j) >>> 1;
                self.put(j < i ? A1 : H1, ".", stack);
                self.put((i + j) >>> 1, "R", stack);
            }
        }
        //# Pawn promotion, double move and en passant capture
        if (p === "P")
        {
            if (A8 <= j && j <= H8)
            {
                self.put(j, pr, stack);
            }
            if (j - i === 2 * N)
            {
                self.ep = i + N;
            }
            if (j === self.ep)
            {
                self.put(j + S, ".", stack);
            }
        }
        //# Should this also be a context manager then?
        const ret = self.rotate();
        //yield self;
        //self.rotate();

        //# Now unmove by putting the pieces back
        for (let [i, p] of stack.reverse())
        {
            self.put(i, p);
        }

        //# And restore the fields
        self.ep = old_ep;
        self.kp= old_kp;
        self.wc = old_wc;
        self.bc = old_bc;

        return ret;
    },
    is_capture: function(move) {
        const self = this;
        //# The original sunfish just checked that the evaluation of a move
        //# was larger than a certain constant. However the current NN version
        //# can have too much fluctuation in the evals, which can lead QS-search
        //# to last forever (until python stackoverflows.) Thus we need to either
        //# dampen the eval function, or like here, reduce QS search to captures
        //# only. Well, captures plus promotions.
        return (self.board.charAt(move.j) !== ".") || (Math.abs(move.j - self.kp) < 2) || (0 < move.prom.length);
    },
    compute_value: function() {
        const self = this;
        //#relu6 = lambda x: np.minimum(np.maximum(x, 0), 6)
        //# TODO: We can maybe speed this up using a fixed `out` array,
        //# as well as using .dot istead of @.
        let act = Math.tanh;
        let wf = self.wf, bf = self.bf;
        //# Pytorch matrices are in the shape (out_features, in_features)
        //#hidden = layer1 @ act(np.concatenate([wf[1:], bf[1:]]))
        let hidden = matadd(matmul(layer1, matfunc(act, wf, 1, -1, 0, 0), 0, -1, 0, 8, 0, -1, 0, 0), matmul(layer1, matfunc(act, bf, 1, -1, 0, 0), 0, -1, 9, -1, 0, -1, 0, 0));
        let score = matmul(layer2, matfunc(act, hidden));
        //#if verbose:
        //#    print(f"Score: {score + model['scale'] * (wf[0] - bf[0])}")
        //#    print(f"from model: {score}, pieces: {wf[0]-bf[0]}")
        //#    print(f"{wf=}")
        //#    print(f"{bf=}")
        return Math.floor((score[0][0] + scale * (wf[0] - bf[0])) * 360);
    },
    hash: function() {
        const self = this;
        if (null == self._h) self._h = self.board+/*','+String(self.score)+*/','+String(self.ep)+','+String(self.kp)+','+(self.wc.map(String).join(','))+','+(self.bc.map(String).join(','));
        return self._h;
    }
};

//###############################################################################
//# Search logic
//###############################################################################

//# lower <= s(pos) <= upper
function Entry(lower, upper)
{
    const self = this;
    self.lower = lower;
    self.upper = upper;
}
Entry.prototype = {
    constructor: Entry,
    lower: null,
    upper: null
};


function Searcher()
{
    const self = this;
    self.tp_score = {};
    self.tp_move = {};
    self.history = new Set([]);
    self.nodes = 0
}
Searcher.prototype = {
    constructor: Searcher,
    tp_score: null,
    tp_move: null,
    history: null,
    nodes: 0,
    bound: function(pos, gamma, depth, root=true) {
        const self = this;
        //# returns r where
        //#    s(pos) <= r < gamma    if gamma > s(pos)
        //#    gamma <= r <= s(pos)   if gamma <= s(pos)
        self.nodes += 1;

        //# Depth <= 0 is QSearch. Here any position is searched as deeply as is needed for
        //# calmness, and from this point on there is no difference in behaviour depending on
        //# depth, so so there is no reason to keep different depths in the transposition table.
        depth = Math.max(depth, 0);

        //# Sunfish is a king-capture engine, so we should always check if we
        //# still have a king. Notice since this is the only termination check,
        //# the remaining code has to be comfortable with being mated, stalemated
        //# or able to capture the opponent king.
        //# I think this line also makes sure we never fail low on king-capture
        //# replies, which might hide them and lead to illegal moves.
        if (pos.score <= -MATE_LOWER)
        {
            return -MATE_UPPER;
        }

        //# Look in the table if we have already searched this position before.
        //# We also need to be sure, that the stored search was over the same
        //# nodes as the current search.
        //# We need to include depth and root, since otherwise the function wouldn't
        //# be consistent. By consistent I mean that if the function is called twice
        //# with the same parameters, it will always fail in the same direction (hi / low).
        //# It might return different soft values though, exactly because the tp tables
        //# have changed.
        let pos_hash = pos.hash();
        let key = pos_hash+','+String(depth)+','+String(root);
        let entry = self.tp_score[key] || (new Entry(-MATE_UPPER, MATE_UPPER));
        if (entry.lower >= gamma) return entry.lower;
        if (entry.upper < gamma) return entry.upper;

        //# We detect 3-fold captures by comparing against previously
        //# _actually played_ positions.
        //# Note that we need to do this before we look in the table, as the
        //# position may have been previously reached with a different score.
        //# This is what prevents a search instability.
        //# Actually, this is not true, since other positions will be affected by
        //# the new values for all the drawn positions.
        //# This is why I've decided to just clear tp_score every time history changes.
        if (!root && self.history.has(pos_hash))
        {
            return 0;
        }

        //# Generator of moves to search in order.
        //# This allows us to define the moves, but only calculate them if needed.
        function* moves()
        {
            //# First try not moving at all. We only do this if there is at least one major
            //# piece left on the board, since otherwise zugzwangs are too dangerous.
            if (depth > 2 && !root && (-1 < pos.board.indexOf('N') || -1 < pos.board.indexOf('B') || -1 < pos.board.indexOf('R') || -1 < pos.board.indexOf('Q')))
            {
                yield [null, -self.bound(pos.rotate(true), 1 - gamma, depth - 3, false)];
            }

            //# For QSearch we have a different kind of null-move, namely we can just stop
            //# and not capture anything else.
            if (depth === 0)
            {
                yield [null, pos.score];
            }

            //# Then killer move. We search it twice, but the tp will fix things for us.
            //# Note, we don't have to check for legality, since we've already done it
            //# before. Also note that in QS the killer must be a capture, otherwise we
            //# will be non deterministic.
            function mvv_lva(move)
            {
                //# Recall mvv_lva gives the _negative_ score
                if (Math.abs(move.j - pos.kp) < 2) return -MATE;
                let {i, j} = move;
                let p = pos.board.charAt(i);
                let q = pos.board.charAt(j);
                let p2 = move.prom.length ? move.prom : p;
                let score = pst[q][j][0] - (pst[p2][j][0] - pst[p][i][0]);
                let pp = _swapcase(p);
                let qq = _swapcase(q);
                let pp2 = _swapcase(p2);
                score -= pst[qq][119-j][0] - (pst[pp2][119-j][0] - pst[pp][119-i][0]);
                //#pp, qq = p.swapcase(), q.swapcase()
                //#score = pst[q][j][0] - (pst[p][j][0] - pst[p][i][0])
                //#score -= pst[qq][119-j][0] - (pst[pp][119-j][0] - pst[pp][119-i][0])
                return score;
            }
            //# Look for the strongest ove from last time, the hash-move.
            let killer = self.tp_move[pos_hash];
            if (killer && (depth > 0 || pos.is_capture(killer)))
            {
                yield [killer, -self.bound(pos.move(killer), 1-gamma, depth-1, false)]
            }

            //# Then all the other moves
            //# moves = [(move, pos.move(move)) for move in pos.gen_moves()]
            //# moves.sort(key=lambda move_pos: pst[pos.board[move_pos[0].i][move

            //# Sort by the score after moving. Since that's from the perspective of our
            //# opponent, smaller score means the move is better for us.
            //# print(f'Searching at {depth=}')
            //# TODO: Maybe try MMT/LVA sorting here. Could be cheaper and work better since
            //# the current evaluation based method doesn't take into account that e.g. capturing
            //# with the queen shouldn't usually be our first option...
            //# It could be fun to train a network too, that scores all the from/too target
            //# squares, say, and uses that to sort...
            //#for move, pos1 in sorted(moves, key=lambda move_pos: move_pos[1].score):
            let _moves = [];
            for (let m of pos.gen_moves()) _moves.push(m);
            _moves.sort(function(a, b) {return mvv_lva(a)-mvv_lva(b);});
            for (let move of _moves)
            {
                //# TODO: We seem to have some issues with our QS search, which eventually
                //# leads to very large jumps in search time. (Maybe we get the classical
                //# "Queen plunders everything" case?) Hence Improving this might solve some
                //# of our timeout issues. It could also be that using a more simple ordering
                //# would speed up the move generation?
                //# See https://home.hccnet.nl/h.g.muller/mvv.html for inspiration
                //# If depth is 0 we only try moves with high intrinsic score (captures and
                //# promotions). Otherwise we do all moves.
                //#if depth > 0 or -pos1.score-pos.score >= QS_LIMIT:
                if (depth > 0 || pos.is_capture(move))
                {
                //#print(mvv_lva(move)*360)
                //#if -mvv_lva(move)*360 >= 30  - depth * 10:
                //#if depth > 0 or (QS_TYPE == QS_CAPTURE and pos.is_capture(move)) or (QS_TYPE != QS_CAPTURE and -mvv_lva(move) >= QS_LIMIT/360):
                    yield [move, -self.bound(pos.move(move), 1-gamma, depth-1, false)]
                }
            }
        }

        //# Run through the moves, shortcutting when possible
        let best = -MATE_UPPER;
        for (let [move, score] of moves())
        {
            best = Math.max(best, score);
            if (best >= gamma)
            {
                //# Save the move for pv construction and killer heuristic
                if (null != move)
                {
                    self.tp_move[pos_hash] = move;
                }
                break;
            }
        }

        //# Stalemate checking
        if (depth > 0 && best === -MATE_UPPER)
        {
            let flipped = pos.rotate(true);
            //# Hopefully this is already in the TT because of null-move
            let in_check = self.bound(flipped, MATE_UPPER, 0) === MATE_UPPER;
            best = in_check ? -MATE_LOWER : 0;
        }

        //# Table part 2
        self.tp_score[key] = best >= gamma ?
            new Entry(best, entry.upper) : new Entry(entry.lower, best);

        return best;
    },
    search: function*(history, maxDepth=999/*!ADDED!*/) {
        const self = this;
        //"""Iterative deepening MTD-bi search"""
        maxDepth = Math.max(1, maxDepth); /*!ADDED!*/
        self.nodes = 0;
        let pos = history[history.length-1];
        self.history = new Set(history.map(function(pos) {return pos.hash();}));
        //# Clearing table due to new history. This is because having a new "seen"
        //# position alters the score of all other positions, as there may now be
        //# a path that leads to a repetition.
        self.tp_score = {};

        let gamma = 0;
        //# In finished games, we could potentially go far enough to cause a recursion
        //# limit exception. Hence we bound the ply. We also can't start at 0, since
        //# that's quiscent search, and we don't always play legal moves there.
        for (let depth of range(1, maxDepth+1/*!ADDED!*/))
        {
            //#yield depth, None, 0, "cp"
            //# The inner loop is a binary search on the score of the position.
            //# Inv: lower <= score <= upper
            //# 'while lower != upper' would work, but play tests show a margin of 20 plays
            //# better.
            let lower = -MATE_UPPER, upper = MATE_UPPER;
            while (lower < upper - EVAL_ROUGHNESS)
            {
                let score = self.bound(pos, gamma, depth);
                if (score >= gamma)
                {
                    lower = score;
                }
                if (score < gamma)
                {
                    upper = score;
                }
                yield [depth, gamma, score, self.tp_move[pos.hash()]];
                gamma = (lower + upper + 1) >>> 1;
            }
        }
        yield [maxDepth+1, 0, 0, null];/*!ADDED!*/ // signal that maxdepth exceeded
    }
};


//###############################################################################
//# UCI User interface
//###############################################################################

function parse(c)
{
    const fil = c.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(c.charAt(1), 10) - 1;
    return A1 + fil - 10 * rank;
}

function render(i)
{
    const rank = Math.floor((i - A1) / 10);
    const fil = (A1 > i ? 10 : 0) + ((i - A1) % 10);
    return String.fromCharCode(fil + 'a'.charCodeAt(0)) + String(-rank + 1);
}

let wf = null, bf = null;
let startpos = null;
let hist = [];

/*!ADDED!*/
const isNode = ("undefined" !== typeof global) && ('[object global]' === {}.toString.call(global));
const isWebWorker = !isNode && ("undefined" !== typeof WorkerGlobalScope) && ("function" === typeof importScripts) && (navigator instanceof WorkerNavigator);
/*!ADDED!*/
const perf = isNode ? require('node:perf_hooks').performance : performance;
const nextTick = isWebWorker ? Promise.resolve().then.bind(Promise.resolve()) : function(then) {then();};

let STOPPED = false; /*!ADDED!*/

sunfish.Move = Move;
sunfish.Position = Position;
sunfish.Entry = Entry;
sunfish.Searcher = Searcher;
sunfish.nnue = function(nnue_json) {
    if (nnue_json && nnue_json.pst)
    {
        pst = Object.keys(nnue_json.pst).reduce(function(pst, k) {
            pst[k] = nnue_json.pst[k];
            return pst;
        }, {});
        pst[' '] = pst['.'];
        layer1 = nnue_json.layer1;
        layer2 = nnue_json.layer2;
        scale = nnue_json.scale;
        [wf, bf] = features(initial);
        startpos = new Position(initial, 0, wf, bf, [true, true], [true, true], 0, 0);
    }
};
sunfish.engine = function(cmd, output=null) {
    const args = String(cmd).split(/\s+/g);
    const out = [];
    const defaultOutput = (msg) => {out.push(msg);};
    if (!output) output = defaultOutput;

    if (args[0] === "uci")
    {
        output("id name " + sunfish.version);
        output("uciok");
    }

    else if (args[0] === "ucinewgame")
    {
    }

    else if (args[0] === "isready")
    {
        output("readyok");
    }

    else if (args[0] === "quit")
    {
        STOPPED = true;
    }

    else if (args[0] === "position" && args[1] === "startpos")
    {
        hist = [startpos];
        const moves = args.slice(3);
        for (let ply of range(moves.length))
        {
            const move = moves[ply];
            if (move.length >= 4)
            {
                let i = parse(move.slice(0,2)), j = parse(move.slice(2,4)), prom = move.slice(4).toUpperCase();
                if (ply % 2 === 1)
                {
                    i = 119 - i;
                    j = 119 - j;
                }
                hist.push(hist[hist.length-1].move(new Move(i, j, prom)));
            }
        }
    }

    else if (args[0] === "go")
    {
        STOPPED = false;
        /*!ADDED!*/
        let wtime = Infinity, winc = 0, btime = Infinity, binc = 0, maxdepth = 999;
        let i = 1;
        while (i < args.length)
        {
            switch (args[i])
            {
                case 'depth':
                if (i+1 < args.length) maxdepth = parseInt(args[i+1]);
                i += 2;
                break;
                case 'wtime':
                if (i+1 < args.length) wtime = parseInt(args[i+1]);
                i += 2;
                break;
                case 'btime':
                if (i+1 < args.length) btime = parseInt(args[i+1]);
                i += 2;
                break;
                case 'winc':
                if (i+1 < args.length) winc = parseInt(args[i+1]);
                i += 2;
                break;
                case 'binc':
                if (i+1 < args.length) binc = parseInt(args[i+1]);
                i += 2;
                break;
                default:
                ++i;
                break;
            }
        }
        if (hist.length % 2 === 0)
        {
            wtime = btime;
            winc = binc;
        }
        let move_str = null;
        const searcher = new sunfish.Searcher();
        const search = searcher.search(hist, maxdepth);
        const think = isFinite(wtime) ? 0.8 * Math.min(wtime / 40 + winc, wtime / 2 - 1) : Infinity;
        const start = perf.now();
        function done()
        {
            output("bestmove " + (move_str || '(none)'));
        }
        function next()
        {
            if (STOPPED) return done();
            // batch process multiple moves to avoid "Maximum call stack size exceeded" due to "next" calls
            let batch = 0;
            while (++batch <= 1000)
            {
                let nextSearch = search.next();
                if (nextSearch.done) return done();
                let [depth, gamma, score, move] = nextSearch.value;
                //# The only way we can be sure to have the real move in tp_move,
                //# is if we have just failed high.
                if (move && (score >= gamma))
                {
                    let {i, j, prom} = move;
                    if (hist.length % 2 === 0)
                    {
                        i = 119 - i;
                        j = 119 - j;
                    }
                    move_str = render(i) + render(j) + prom.toLowerCase();
                    //output("info depth "+depth+" score cp "+score+" pv "+move_str);
                }
                if ((move_str && !isFinite(think)) || (depth > maxdepth) || (perf.now() - start > think))
                {
                    return done();
                }
            }
            nextTick(next);
        }
        nextTick(next);
    }

    else if (args[0] === "stop")
    {
        STOPPED = true; /*!ADDED!*/
    }

    if (output === defaultOutput) return out.join("\n");
};

// export it
return sunfish;
});
