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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var functions = require('./functions.js');
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var path = require('path');
var app = express_1.default();
//https settings
var rootDir = path.resolve(__dirname, '../../');
var logJsonPath = '/home/pi/log.json';
var adminlogJsonPath = '/home/pi/adminlog.json';
var http = require('http');
var httpServer = http.createServer(app);
var io = require('socket.io')(httpServer);
var port = 8080;
//mount usb
var accountsDir = '/media/usb/compilerserver/accounts/';
functions.mountUsb(accountsDir);
//ip filter
var blacklistPath = '/home/pi/ipBlacklist';
var ipList;
functions.updateIpBlacklist(blacklistPath).then(function (value) { return ipList = value; });
// const ipfilter = require('express-ipfilter').IpFilter;
fs_1.default.watchFile(blacklistPath, function (curr, prev) {
    functions.updateIpBlacklist(blacklistPath).then(function (value) { return ipList = value; });
});
//database (mongoose)
var mongoose_1 = __importDefault(require("mongoose"));
var User = require('./database');
mongoose_1.default.connect('mongodb+srv://coder6583:curvingchicken@compilerserver.akukg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(function () { functions.LOG('connected to database.', 'connected to database.'); });
mongoose_1.default.Promise = global.Promise;
//passport
var passport_1 = __importDefault(require("passport"));
var LocalStrategy = require('passport-local').Strategy;
passport_1.default.use(new LocalStrategy({ usernameField: 'loginId', passwordField: 'loginPassword' }, functions.loginCheck));
passport_1.default.serializeUser(function (user, done) {
    // console.log(user, 'serialize');
    done(null, user);
});
passport_1.default.deserializeUser(function (user, done) {
    // console.log(user, 'deserialize');
    done(null, user);
});
//Login with Google
var GoogleStrategy = require('passport-google-oauth20').Strategy;
passport_1.default.use(GoogleStrategy);
//bcrypt = hash function
var rootdirectory = path.resolve(rootDir, 'client');
//express session
var express_session_1 = __importDefault(require("express-session"));
var express_socket_io_session_1 = __importDefault(require("express-socket.io-session"));
//request時に実行するmiddleware function
app.use(express_1.default.static(rootdirectory));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var sessionMiddleware = express_session_1.default({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
});
app.use(sessionMiddleware);
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(everyRequest);
function everyRequest(req, res, next) {
    // console.log(req.user);
    if (req.user != "admin" && (req.originalUrl != '/login')) {
        passport_1.default.authenticate('local', {
            successRedirect: '/admin',
            failureRedirect: '/login'
        })(req, res, next);
        // console.log(req.user);
        functions.LOG('not logged in', 'login');
    }
    else {
        if (ipList.includes(req.socket.remoteAddress)) {
            functions.LOG("Blacklisted-ip tried to access. IP: " + req.socket.remoteAddress, 'ip');
            // console.log('Blacklisted ip tried to access. IP: ', req.socket.remoteAddress);
            res.send('banned L');
            res.end();
        }
        else {
            if (!req.originalUrl.startsWith('/avatar/'))
                functions.LOG("Request URL: " + req.originalUrl + " \nIP: " + req.socket.remoteAddress, 'ip');
            next();
        }
    }
}
app.get('/', function (req, res) {
    res.sendFile('index.html', { root: rootdirectory });
});
app.get('/login', function (req, res) {
    res.sendFile('index.html', { root: rootdirectory });
});
app.post('/login', function (req, res, next) {
    // console.log(req.body);
    passport_1.default.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/login'
    })(req, res, next);
});
app.get('/admin', function (req, res) {
    res.sendFile('admin.html', { root: rootdirectory });
});
app.get('/avatar/id', function (req, res) {
    functions.LOG("" + req.query, 'avatar image debug');
    var avatarPath = path.resolve('/media/usb/compilerserver/accounts', req.query.id, 'avatar.png');
    fs_1.default.access(avatarPath, function (err) {
        if (err) {
            res.sendFile(path.resolve(__dirname, 'guest.png'));
        }
        else {
            res.sendFile(avatarPath);
        }
    });
});
io.use(express_socket_io_session_1.default(sessionMiddleware, {}));
var logSize = 0, adminlogSize = 0;
fs_1.default.readFile(logJsonPath, function (err, data) {
    var temp = JSON.parse(data.toString() || "null");
    logSize = temp.length;
});
fs_1.default.readFile(adminlogJsonPath, function (err, data) {
    var temp = JSON.parse(data.toString() || "null");
    adminlogSize = temp.length;
});
fs_1.default.watchFile(logJsonPath, function (curr, prev) {
    fs_1.default.readFile(logJsonPath, function (err, data) {
        var temp = JSON.parse(data.toString() || "null");
        if (temp) {
            io.sockets.emit('newLog', {
                value: temp.slice(logSize)
            });
            logSize = temp.length;
        }
    });
});
fs_1.default.watchFile(adminlogJsonPath, function (curr, prev) {
    fs_1.default.readFile(adminlogJsonPath, function (err, data) {
        var temp = JSON.parse(data.toString() || "null");
        if (temp) {
            io.sockets.emit('newLog', {
                value: temp.slice(adminlogSize)
            });
            adminlogSize = temp.length;
        }
    });
});
io.sockets.on('connection', function (socket) { return __awaiter(void 0, void 0, void 0, function () {
    var taskManagerTimer;
    return __generator(this, function (_a) {
        taskManagerTimer = setInterval(function () { functions.taskManager(socket); }, 1000);
        // console.log(JSON.stringify(socket.handshake.address));
        socket.on('command', function (input) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                functions.parseCommand(input.command, socket);
                return [2 /*return*/];
            });
        }); });
        socket.on('logGet', function (input) { return __awaiter(void 0, void 0, void 0, function () {
            var serverFilter, filteredLog, jsonLogs;
            return __generator(this, function (_a) {
                functions.LOG(input, 'debug');
                serverFilter = functions.parseServerFilter(input.filter.server);
                filteredLog = [];
                jsonLogs = [];
                if (serverFilter.main == true) {
                    jsonLogs.push(functions.parseFilter('/home/pi/log.json', input.filter));
                }
                if (serverFilter.admin == true) {
                    jsonLogs.push(functions.parseFilter('/home/pi/adminlog.json', input.filter));
                }
                Promise.all(jsonLogs).then(function (value) {
                    value.forEach(function (element) {
                        filteredLog = filteredLog.concat(element);
                    });
                    // console.log(filteredLog[0]);
                    filteredLog.sort(function (a, b) {
                        return b.timestamp - a.timestamp;
                    });
                    var logSize = filteredLog.length;
                    filteredLog = filteredLog.slice(input.from - 1, input.until);
                    // console.error(filteredLog);
                    socket.emit('logReturn', {
                        value: filteredLog,
                        max: logSize
                    });
                });
                return [2 /*return*/];
            });
        }); });
        socket.on('usersGet', function (input) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                User.find({}, function (err, docs) {
                    var users = [];
                    docs.forEach(function (element) {
                        var temp = {
                            id: element.username,
                            username: element.displayName,
                            avatar: "",
                            email: element.email
                        };
                        users.push(temp);
                    });
                    socket.emit('usersReturn', {
                        value: users
                    });
                });
                return [2 /*return*/];
            });
        }); });
        socket.on('blacklistGet', function (input) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                socket.emit('blacklistReturn', {
                    value: ipList
                });
                return [2 /*return*/];
            });
        }); });
        socket.on('blacklistAdd', function (input) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                fs_1.default.appendFile('/home/pi/ipBlacklist', input.value + ";\n", function (err) {
                    if (err)
                        console.error(err);
                    else {
                        functions.LOG(ipList.length + 1 + " blocked ip addresses.", ipList.length + 1 + " blocked ip addresses.");
                    }
                });
                return [2 /*return*/];
            });
        }); });
        socket.on('disconnect', function () {
            socket.removeAllListeners('command');
        });
        return [2 /*return*/];
    });
}); });
// 404
app.use(function (req, res, next) {
    res.status(404);
    res.sendFile('err404.html', { root: rootdirectory });
});
httpServer.listen(port, function () {
    functions.LOG('Server at https://rootlang.ddns.net', 'Server at https://rootlang.ddns.net');
});
