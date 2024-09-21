"use strict";

const sunfish_nnue = require('./sunfish_nnue.js');

// NNUE json model
sunfish_nnue.nnue(JSON.parse(require('fs').readFileSync(require('path').join(__dirname, './nnue/models/tanh.json'))));

function runCMD(cmd)
{
    sunfish_nnue.engine(cmd, (output) => console.log(output));
}

runCMD('uci');
runCMD('isready');
runCMD('position startpos moves e2e4');
runCMD('go depth 4 wtime 10000 btime 10000');