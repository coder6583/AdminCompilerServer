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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var exec = require('child_process').exec;
function mountUsb(accountsDir) {
    fs_1.default.access(accountsDir, function (err) {
        if (err && err.code == 'ENOENT') {
            fs_1.default.access('/media/pi/A042-416A', function (err) {
                if (!err) {
                    exec('sudo umount /media/pi/A042-416A', function () {
                        exec('sudo mount /dev/sda1 /media/usb', function () {
                            console.log('mounted usb');
                        });
                    });
                }
                else {
                    exec('sudo mount /dev/sda1 /media/usb', function () {
                        console.log('mounted usb');
                    });
                }
            });
        }
    });
}
function updateIpBlacklist(blacklistDir) {
    var ipList = [];
    fs_1.default.readFile(blacklistDir, function (err, data) {
        if (err) {
            console.log('Could not read blacklist.');
        }
        else {
            var blacklistData = data.toString();
            ipList = blacklistData.split(';\n');
            console.log(ipList.length + ' blocked ip addresses.');
            return ipList;
        }
        return [];
    });
}
var bcrypt_1 = __importDefault(require("bcrypt"));
function loginCheck(username, password, done) {
    var hash = "$2b$10$aha8xyjAjp971NX3MXzq.Ouj6YhstYcBCXlsdrpBB5xrJxjI5RoOe";
    console.log('Login Attempt');
    if (username == 'admin') {
        bcrypt_1.default.compare(password, hash, function (err, isMatch) {
            if (err)
                console.log(err);
            if (isMatch) {
                console.log('logged in!');
                return done(null, username);
            }
            else {
                return done(err, false, { message: 'password incorrect' });
            }
        });
    }
}
var systeminformation_1 = __importDefault(require("systeminformation"));
var os_utils_1 = __importDefault(require("os-utils"));
function taskManager() {
    os_utils_1.default.cpuUsage(function (percentage) {
        // console.log('CPU: ' + percentage * 100 + '%');
        socket.emit('cpu-usage', {
            percentage: percentage * 100
        });
    });
    systeminformation_1.default.mem().then(function (data) {
        // console.log('Memory: ' + (100 - data.available / data.total * 100));
        socket.emit('memory-usage', {
            percentage: (100 - data.available / data.total * 100),
            total: data.total,
            using: data.total - data.available,
        });
    });
    systeminformation_1.default.networkStats().then(function (data) {
        // console.log('Received:', data[0].rx_sec, 'Transmitted: ', data[0].tx_sec);
        socket.emit('network-usage', {
            received: data[0].rx_sec,
            transmitted: data[0].tx_sec
        });
    });
    systeminformation_1.default.fsStats().then(function (data) {
        // console.log('Read: ',data.rx_sec, 'Wrote: ', data.wx_sec);
        socket.emit('disk-usage', {
            read: data.rx_sec,
            write: data.wx_sec
        });
    });
}
var io = require('socket.io');
function parseCommand(command, socket) {
    var words = command.split(' ');
    console.log(words[0]);
    //update
    if (words[0] == 'update') {
        if (words.length == 1) {
            socket.emit('result', {
                success: false,
                result: 'アップデートするサーバーを選んでください。(main, admin)'
            });
        }
        else if (words.length > 2) {
            socket.emit('result', {
                success: false,
                result: 'パラメターが多すぎます。'
            });
        }
        else if (words[1] == 'main') {
            exec('git -C /home/pi/Compiler stash', function (err, stdout, stderr) {
                if (err)
                    socket.emit('result', {
                        success: false,
                        result: 'スタッシュ失敗'
                    });
                else
                    socket.emit('result', {
                        success: true,
                        result: 'スタッシュ失敗'
                    });
                exec('git -C /home/pi/Compiler pull', function (err, stdout, stderr) {
                    if (err)
                        socket.emit('result', {
                            success: false,
                            result: stdout + ' ' + stderr
                        });
                    else
                        socket.emit('result', {
                            success: true,
                            result: stdout + ' ' + stderr
                        });
                    exec('chmod +x /home/pi/Compiler/server/nodejs/https_server.js', function (err, stdout, stderr) {
                        if (err)
                            socket.emit('result', {
                                success: false,
                                result: stdout + ' ' + stderr
                            });
                        else
                            socket.emit('result', {
                                success: true,
                                result: stdout + ' ' + stderr
                            });
                    });
                });
            });
        }
        else if (words[1] == 'admin') {
            exec('git -C /home/pi/AdminCompilerServer stash', function (err, stdout, stderr) {
                if (err)
                    socket.emit('result', {
                        success: false,
                        result: 'スタッシュ失敗'
                    });
                else
                    socket.emit('result', {
                        success: true,
                        result: 'スタッシュ失敗'
                    });
                exec('git -C /home/pi/AdminCompilerServer pull', function (err, stdout, stderr) {
                    if (err)
                        socket.emit('result', {
                            success: false,
                            result: stdout + '\n' + stderr
                        });
                    else
                        socket.emit('result', {
                            success: true,
                            result: stdout + '\n' + stderr
                        });
                    exec('chmod +x /home/pi/AdminCompilerServer/server/nodejs/https_server.js', function (err, stdout, stderr) {
                        if (err)
                            socket.emit('result', {
                                success: false,
                                result: stdout + '\n' + stderr
                            });
                        else
                            socket.emit('result', {
                                success: true,
                                result: stdout + '\n' + stderr
                            });
                    });
                });
            });
        }
        else if (words[1] != 'main' && words[1] != 'admin') {
            socket.emit('result', {
                success: false,
                result: 'アップデートするサーバーを選んでください。(main, admin)'
            });
        }
        else {
            socket.emit('result', {
                success: false,
                result: '変なことしないでください'
            });
        }
    }
    //restart
    else if (words[0] == 'restart') {
        if (words.length == 1) {
            socket.emit('result', {
                success: false,
                result: '再起動するサーバーを選んでください。(main, admin)'
            });
        }
        else if (words.length > 2) {
            socket.emit('result', {
                success: false,
                result: 'パラメターが多すぎます。'
            });
        }
        else if (words[1] == 'main') {
            exec('sudo systemctl restart compilerserver', function (err, stdout, stderr) {
                if (err)
                    socket.emit('result', {
                        success: false,
                        value: stdout + '\n' + stderr
                    });
                else
                    socket.emit('result', {
                        success: true,
                        value: '再起動成功'
                    });
            });
        }
        else if (words[1] == 'admin') {
            exec('sudo systemctl restart admincompilerserver', function (err, stdout, stderr) {
                if (err)
                    socket.emit('result', {
                        success: false,
                        value: stdout + '\n' + stderr
                    });
                else
                    socket.emit('result', {
                        success: true,
                        value: '再起動成功'
                    });
            });
        }
        else if (words[1] != 'main' && words[1] != 'admin') {
            socket.emit('result', {
                success: false,
                result: '再起動するサーバーを選んでください。(main, admin)'
            });
        }
        else {
            socket.emit('result', {
                success: false,
                result: '変なことしないでください'
            });
        }
    }
    //start
    else if (words[0] == 'start') {
        if (words.length == 1) {
            socket.emit('result', {
                success: false,
                result: '起動するサーバーを選んでください。(main, admin)'
            });
        }
        else if (words.length > 2) {
            socket.emit('result', {
                success: false,
                result: 'パラメターが多すぎます。'
            });
        }
        else if (words[1] == 'main') {
            exec('sudo systemctl start compilerserver', function (err, stdout, stderr) {
                if (err)
                    socket.emit('result', {
                        success: false,
                        value: stdout + '\n' + stderr
                    });
                else
                    socket.emit('result', {
                        success: true,
                        value: '起動成功'
                    });
            });
        }
        else if (words[1] == 'admin') {
            exec('sudo systemctl start admincompilerserver', function (err, stdout, stderr) {
                if (err)
                    socket.emit('result', {
                        success: false,
                        value: stdout + '\n' + stderr
                    });
                else
                    socket.emit('result', {
                        success: true,
                        value: '起動成功'
                    });
            });
        }
        else if (words[1] != 'main' && words[1] != 'admin') {
            socket.emit('result', {
                success: false,
                result: '起動するサーバーを選んでください。(main, admin)'
            });
        }
        else {
            socket.emit('result', {
                success: false,
                result: '変なことしないでください'
            });
        }
    }
    //stop
    else if (words[0] == 'stop') {
        if (words.length == 1) {
            socket.emit('result', {
                success: false,
                result: '停止するサーバーを選んでください。(main, admin)'
            });
        }
        else if (words.length > 2) {
            socket.emit('result', {
                success: false,
                result: 'パラメターが多すぎます。'
            });
        }
        else if (words[1] == 'main') {
            exec('sudo systemctl stop compilerserver', function (err, stdout, stderr) {
                if (err)
                    socket.emit('result', {
                        success: false,
                        value: stdout + '\n' + stderr
                    });
                else
                    socket.emit('result', {
                        success: true,
                        value: '停止成功'
                    });
            });
        }
        else if (words[1] == 'admin') {
            exec('sudo systemctl stop admincompilerserver', function (err, stdout, stderr) {
                if (err)
                    socket.emit('result', {
                        success: false,
                        value: stdout + '\n' + stderr
                    });
                else
                    socket.emit('result', {
                        success: true,
                        value: '停止成功'
                    });
            });
        }
        else if (words[1] != 'main' && words[1] != 'admin') {
            socket.emit('result', {
                success: false,
                result: '停止するサーバーを選んでください。(main, admin)'
            });
        }
        else {
            socket.emit('result', {
                success: false,
                result: '変なことしないでください'
            });
        }
    }
    else if (words[0] == 'list') {
        console.log('aaaa');
        socket.emit('result', {
            success: true,
            result: 'list'
        });
    }
}
function parseServerFilter(filter) {
    if (filter.length == 0) {
        return { main: true, admin: true };
    }
    else if (filter.length == 1) {
        if (filter.includes('main')) {
            return { main: true, admin: false };
        }
        else if (filter.includes('admin')) {
            return { main: false, admin: true };
        }
    }
    else if (filter.length == 2) {
        return { main: true, admin: true };
    }
}
function parseFilter(jsonPath, filter) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var filteredLog = [];
                    fs_1.default.readFile(jsonPath, function (err, data) {
                        if (err)
                            console.error(err);
                        else {
                            var logArray = JSON.parse(data);
                            logArray.forEach(function (element) {
                                if (filter.before && filter.after) {
                                    console.log('time');
                                    if (!(filter.before <= element.timestamp && element.timestamp <= filter.after)) {
                                        console.log('not in between');
                                        return;
                                    }
                                }
                                if (filter.category.length > 0) {
                                    console.log('category');
                                    var inCategory_1 = false;
                                    filter.category.forEach(function (cat) {
                                        if (element.category == cat) {
                                            inCategory_1 = true;
                                        }
                                    });
                                    if (inCategory_1 == false) {
                                        return;
                                    }
                                }
                                if (filter.keyword.length > 0) {
                                    console.log('keyword');
                                    var hasKeyword_1 = false;
                                    filter.keyword.forEach(function (keyword) {
                                        if (element.value.includes(keyword)) {
                                            hasKeyword_1 = true;
                                        }
                                    });
                                    if (hasKeyword_1 == false) {
                                        return;
                                    }
                                }
                                console.log('i made it');
                                filteredLog.push(element);
                            });
                        }
                    });
                    resolve(filteredLog);
                })];
        });
    });
}
module.exports = { mountUsb: mountUsb, updateIpBlacklist: updateIpBlacklist, loginCheck: loginCheck, taskManager: taskManager, parseCommand: parseCommand, parseServerFilter: parseServerFilter, parseFilter: parseFilter };
