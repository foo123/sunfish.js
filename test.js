"use strict";

const sunfish = require('./sunfish.js');

function runCMD(cmd)
{
    sunfish.engine(cmd, (output) => console.log(output));
}

runCMD('uci');
runCMD('isready');
runCMD('position startpos moves e2e4');
runCMD('go depth 4');