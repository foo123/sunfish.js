# sunfish.js

JavaScript port of [Sunfish Python Chess Engine](https://github.com/thomasahle/sunfish)


**Example for node:**

```javascript
const sunfish = require('./sunfish.js');

function runCMD(cmd)
{
    sunfish.engine(cmd, (output) => console.log(output));
}

runCMD('uci');
runCMD('isready');
runCMD('position startpos moves e2e4');
runCMD('go depth 4');
```

**Example for browser ran in web worker:**

```javascript
const sunfish = {engine: new Worker('./sunfish.js')};

function runCMD(cmd)
{
    sunfish.engine.postMessage(cmd);
}
sunfish.engine.onmessage = function(evt) {
    console.log(evt && evt.data ? evt.data : evt);
};

runCMD('uci');
runCMD('isready');
runCMD('position startpos moves e2e4');
runCMD('go depth 4');
```

**Output:**

```text
id name sunfish 2023
uciok
readyok
bestmove e7e5
```

**NNUE example for node:**

1. Transform the **NNUE** model pickle from sunfish repo to JSON using the `nnue/nnue-pickle-to-json.py` tool (here `tanh.pickle` NNUE model is used).
2. Include the `numjs.js` lib dependency which is an analog of Python's `numpy` for JavaScript.


```javascript
const sunfish_nnue = require('./sunfish_nnue.js');

// numjs dependency
sunfish_nnue.numjs(require('./numjs.js'));
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
```

**Output:**

```text
id name sunfish nnue
uciok
readyok
bestmove e7e5
```