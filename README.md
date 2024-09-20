# sunfish.js

JavaScript port of [Sunfish Python Chess Engine](https://github.com/thomasahle/sunfish)

(NB: NNUE version will be ported as well)

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

**Output**

```text
id name sunfish 2023
uciok
readyok
bestmove e7e5
```