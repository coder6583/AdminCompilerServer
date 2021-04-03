#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var path = require('path');
var exec = require('child_process').exec;
var app = express_1.default();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 80;
var accountsDir = '/media/usb/compilerserver/accounts/';
var rootDir = path.resolve(__dirname, '../../client');
//request時に実行するmiddleware function
function authenticate(req, res, next) {
    console.log('Request URL: ', req.originalUrl);
    next();
}
app.use(express_1.default.static(rootDir));
app.use(authenticate);
app.get('/', function (req, res) {
    res.sendFile('index.html', { root: rootDir });
});
app.get('/login', function (req, res) {
    res.sendFile('login.html', { root: rootDir });
});
app.get('/editor', function (req, res) {
    res.sendFile('editor.html', { root: rootDir });
});
app.get('/docs', function (req, res) {
    res.sendFile('docs.html', { root: rootDir });
});
app.get('/admin', function (req, res) {
    res.sendFile('admin.html', { root: rootDir });
});
var users = new Map();
var usersDirectory = new Map();
//ディレクトリー読むための再帰関数
function readDirectory(path, socket, result, callback) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fs_1.default.readdir(path, { withFileTypes: true }, function (err, content) { return __awaiter(_this, void 0, void 0, function () {
                        var files_1, folders_1, fn, temp, tempfolders, tempfiles;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!err) return [3 /*break*/, 1];
                                    console.log('couldnt load project', 24);
                                    socket.emit('loadedProject', {
                                        value: 'Could not load folder ' + path,
                                        style: err
                                    });
                                    return [3 /*break*/, 3];
                                case 1:
                                    files_1 = new Map();
                                    folders_1 = new Map();
                                    fn = function processContent(element) {
                                        if (element.isFile()) {
                                            files_1.set(element.name, { type: 'file', name: element.name });
                                            return { type: 'file', name: element.name };
                                        }
                                        else if (element.isDirectory()) {
                                            return readDirectory(path + '/' + element.name, socket, { type: 'folder', name: element.name, value: [] }, function (val) {
                                                folders_1.set(element.name, val);
                                                return val;
                                            });
                                        }
                                    };
                                    return [4 /*yield*/, Promise.all(content.map(fn))];
                                case 2:
                                    temp = _a.sent();
                                    tempfolders = new Map(__spread(folders_1).sort(function (a, b) { return Number(a[0] > b[0]); }));
                                    tempfolders.forEach(function (folder) {
                                        if (result.value)
                                            result.value.push(folder);
                                    });
                                    tempfiles = new Map(__spread(files_1).sort(function (a, b) { return Number(a[0] > b[0]); }));
                                    tempfiles.forEach(function (file) {
                                        if (result.value)
                                            result.value.push(file);
                                    });
                                    _a.label = 3;
                                case 3:
                                    resolve(result);
                                    return [2 /*return*/, callback(result)];
                            }
                        });
                    }); });
                })];
        });
    });
}
io.sockets.on('connection', function (socket) {
    var address = socket.handshake.address;
    console.log('New connection from ' + JSON.stringify(address) + socket.id);
    //defaultはguestとして入る
    users.set(socket.id, "guest");
    fs_1.default.mkdir(accountsDir + 'guest/' + socket.id, function (err) {
        if (err) {
            console.log('could not create ' + accountsDir + 'guest/' + socket.id);
        }
    });
    usersDirectory.set(socket.id, accountsDir + 'guest/' + socket.id);
    socket.on('compile', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // コンパイル
            exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.filename, function (err, stdout, stderr) {
                if (err) {
                    socket.emit('output', {
                        value: stderr,
                        style: 'err'
                    });
                }
                exec('./compiler ' + input.filename + ' ' + usersDirectory.get(socket.id) + '/', function (err, stdout, stderr) {
                    // 出力
                    console.log(err, stdout, stderr);
                    if (err) {
                        socket.emit('output', {
                            value: stderr,
                            style: 'err'
                        });
                        exec('sudo rm -f ' + input.filename + ' .' + input.filename);
                    }
                    else {
                        socket.emit('output', {
                            value: stdout,
                            style: 'log'
                        });
                        exec('sudo rm -f ' + input.filename + ' .' + input.filename);
                    }
                    return;
                });
            });
            return [2 /*return*/];
        });
    }); });
    socket.on('save', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            //ファイルにセーブ
            if (users.get(socket.id) == 'guest') {
                socket.emit('saved', {
                    value: 'If you want to save a file, please create an account.',
                    style: 'err',
                    success: false
                });
            }
            else {
                exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.projectName + '/' + input.filename, function (err, stdout, stderr) {
                    if (err) {
                        socket.emit('saved', {
                            value: stderr + ' : Save not complete.',
                            style: 'err',
                            success: false
                        });
                    }
                    else {
                        socket.emit('saved', {
                            value: 'Save complete.',
                            style: 'info',
                            success: true
                        });
                    }
                    return;
                });
            }
            ;
            return [2 /*return*/];
        });
    }); });
    //loginシステム
    socket.on('login', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            //usersのvalueをアカウント名にする
            users.set(socket.id, input.accountName);
            usersDirectory.set(socket.id, accountsDir + input.accountName);
            return [2 /*return*/];
        });
    }); });
    //すでに作られたProjectをロードする
    socket.on('loadProject', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            result = { type: 'folder', name: input.projectName, value: [] };
            // console.log(readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result));
            readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result, function () { }).then(function (val) {
                socket.emit('loadedProject', {
                    value: val,
                    style: 'log'
                });
            });
            return [2 /*return*/];
        });
    }); });
    //Projectを作る
    socket.on('createProject', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            fs_1.default.mkdir(usersDirectory.get(socket.id) + '/' + input.projectName, function (err) {
                if (err) {
                    socket.emit('createdProject', {
                        value: 'Could not create project ' + input.projectName,
                        style: 'err'
                    });
                }
                else {
                    socket.emit('createdProject', {
                        value: 'Created project ' + input.projectName,
                        style: 'log'
                    });
                }
            });
            return [2 /*return*/];
        });
    }); });
    //disconnectしたとき
    socket.on('disconnect', function () {
        console.log("a");
        if (users.get(socket.id) == 'guest') {
            if (usersDirectory.get(socket.id)) {
                fs_1.default.rmdir((usersDirectory.get(socket.id)), function (err) {
                    console.log(usersDirectory.get(socket.id));
                });
            }
        }
    });
});
http.listen(port, function () {
    console.log('Server at http://rootlang.ddns.net');
});
