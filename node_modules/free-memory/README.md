# node-free-memory
Gets system memory information (from `free`) in a nicely formatted way. 

## Usage

```js
var free = require("free-memory")

free(function (err, info) {

    console.log(info);
    /* Outputs:
    {
        mem: {
            total: 7663792,
            used: 6297348,
            free: 1366444,
            shared: 170644,
            buffers: 1672100,
            cached: 2042312,
            usable: 5080856 // free + buffers + cached
        },
        buffers: {
            used: 2582936,
            free: 5080856
        },
        cache: {
            used: 2582936,
            free: 5080856,
        },
        swap: {
            total: 8307708,
            used: 500,
            free: 8307208
        }
    }
    */

});

```

- All values are integers in Kb, same as free output. Divide by 1024 to get MB.
- mem.usable is same as mem.free + mem.buffers + mem.cached
- buffers and cache are the same values. 