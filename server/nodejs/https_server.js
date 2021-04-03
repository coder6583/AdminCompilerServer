#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var path = require('path');
var exec = require('child_process').exec;
var app = express_1.default();
//https settings
var rootDir = path.resolve(__dirname, '../../');
var http = require('http');
//http to https auto redirection
// const http = require('http');
// http.createServer((express()).all("*", function (request, response) {
//   response.redirect(`https://${request.hostname}${request.url}`);
// })).listen(80);
var httpServer = http.createServer(app);
var io = require('socket.io')(httpServer);
var port = 8080;
//mount usb
var accountsDir = '/media/usb/compilerserver/accounts/';
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
//ip filter
var ipList;
fs_1.default.readFile('/home/pi/ipBlacklist', function (err, data) {
    if (err) {
        console.log('Could not read blacklist.');
    }
    else {
        var blacklistData = data.toString();
        ipList = blacklistData.split(';\n');
        console.log(ipList);
    }
});
// const ipfilter = require('express-ipfilter').IpFilter;
fs_1.default.watchFile('/home/pi/ipBlacklist', function (curr, prev) {
    fs_1.default.readFile('/home/pi/ipBlacklist', function (err, data) {
        if (err) {
            console.log('Could not read ipBlacklist.');
        }
        else {
            var blacklistData = data.toString();
            ipList = blacklistData.split(';\n');
            console.log(ipList);
            // app.use(ipfilter(ipList));
        }
    });
});
//database (mongoose)
var mongoose_1 = __importDefault(require("mongoose"));
var User = require('./database');
mongoose_1.default.connect('mongodb+srv://coder6583:curvingchicken@compilerserver.akukg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(function () { console.log('connected'); });
mongoose_1.default.Promise = global.Promise;
//passport
var hash = "$2b$10$aha8xyjAjp971NX3MXzq.Ouj6YhstYcBCXlsdrpBB5xrJxjI5RoOe";
var passport_1 = __importDefault(require("passport"));
var LocalStrategy = require('passport-local').Strategy;
passport_1.default.use(new LocalStrategy({ usernameField: 'loginId', passwordField: 'loginPassword' }, function (username, password, done) {
    console.log('hello');
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
}));
passport_1.default.serializeUser(function (user, done) {
    console.log(user, 'serialize');
    done(null, user);
});
passport_1.default.deserializeUser(function (user, done) {
    console.log(user, 'deserialize');
    done(null, user);
    // User.findById(id, (err: any, user: any) => {
    //   // console.log(user.id);
    //   done(err, user);
    // })
});
//Login with Google
var GoogleStrategy = require('passport-google-oauth20').Strategy;
passport_1.default.use(GoogleStrategy);
//bcrypt = hash function
var bcrypt_1 = __importDefault(require("bcrypt"));
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
    console.log('everyRequest');
    if (!req.session.passport) {
        res.sendFile('index.html', { root: rootdirectory });
        console.log('not logged in');
        next();
    }
    // else if(req.session.passport.user != "admin")
    // {
    //   console.log('a');
    //   res.sendFile('index.html', {root: rootdirectory});
    //   console.log(req.session.passport.user);
    //   next();
    // }
    if (ipList.includes(req.socket.remoteAddress)) {
        console.log('Blacklisted ip tried to access. IP: ', req.socket.remoteAddress);
        res.send('banned L');
        res.end();
    }
    else {
        console.log('Request URL: ', req.originalUrl, '\nIP:', req.socket.remoteAddress);
        // console.log(req.user, 'everyRequest');
        next();
    }
}
app.get('/', function (req, res) {
    res.sendFile('index.html', { root: rootdirectory });
});
app.get('/login', function (req, res) {
    res.sendFile('index.html', { root: rootdirectory });
});
app.post('/login', function (req, res, next) {
    console.log(req.body);
    passport_1.default.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/login'
    })(req, res, next);
});
app.get('/admin', function (req, res) {
    res.sendFile('admin.html', { root: rootdirectory });
});
var users = new Map();
var usersDirectory = new Map();
var usersProjectDirectory = new Map();
io.use(express_socket_io_session_1.default(sessionMiddleware, {}));
io.sockets.on('connection', function (socket) {
});
// 404
app.use(function (req, res, next) {
    res.status(404);
    res.sendFile('err404.html', { root: rootdirectory });
});
httpServer.listen(port, function () {
    console.log('Server at https://rootlang.ddns.net');
});
