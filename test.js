"use strict";

const sunfish = require('./sunfish.js');

console.log(sunfish.engine('uci'));
console.log(sunfish.engine('isready'));
console.log(sunfish.engine('position startpos moves e2e4'));
console.log(sunfish.engine('go depth 4'));