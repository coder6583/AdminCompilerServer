'use strict';

var free = require("./index");
var test = require("tap").test;
var assert = require("assert");

test("Basic info works", function (t) {
    free(function (err, info) {
        assert(!err, err);
        assert(info.mem);
        assert.equal(Object.keys(info.mem).length, 7);
        assert.equal(info.mem.usable, info.mem.free + info.mem.buffers + info.mem.cached);
        assert(info.buffer);
        assert.equal(Object.keys(info.buffer).length, 2);
        assert.equal(info.buffer.used, info.mem.total - info.mem.usable);
        assert.equal(info.buffer.free, info.mem.usable);
        assert(info.cache);
        assert.equal(info.buffer, info.cache);
        assert(info.swap);
        assert.equal(Object.keys(info.swap).length, 3);
        
        t.end();
    });
});
