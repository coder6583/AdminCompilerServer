#!/usr/bin/env node

import { ExpressionStatement, server } from "typescript";

const functions = require('./functions.js');

import express from 'express';
import fs from 'fs';
import { Stream } from "stream";
const path = require('path');
const app: express.Express = express();
//https settings
const rootDir: string = path.resolve(__dirname, '../../');
const logJsonPath: string = '/home/pi/log.json';
const adminlogJsonPath: string = '/home/pi/adminlog.json';
const http = require('http');
const httpServer = http.createServer(app);
const io = require('socket.io')(httpServer);
const port: number = 8080;
//mount usb
const accountsDir: string = '/media/usb/compilerserver/accounts/';
functions.mountUsb(accountsDir);
//ip filter
const blacklistPath: string = '/home/pi/ipBlacklist';
var ipList: Array<string>;
functions.updateIpBlacklist(blacklistPath).then((value: any) => ipList = value);
// const ipfilter = require('express-ipfilter').IpFilter;
fs.watchFile(blacklistPath, (curr: any, prev: any) => {
	functions.updateIpBlacklist(blacklistPath).then((value: any) => ipList = value);
});

//database (mongoose)
import mongoose from 'mongoose';
const User: mongoose.Model<any, any> = require('./database');
mongoose.connect('mongodb+srv://coder6583:curvingchicken@compilerserver.akukg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(() => { functions.LOG('connected to database.', 'connected to database.'); });

mongoose.Promise = global.Promise;
//passport
import passport from 'passport';
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
	{ usernameField: 'loginId', passwordField: 'loginPassword' }, functions.loginCheck
));
passport.serializeUser((user: any, done) => {
	// console.log(user, 'serialize');
	done(null, user);
})
passport.deserializeUser((user: any, done) => {
	// console.log(user, 'deserialize');
	done(null, user);
})

//Login with Google
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(GoogleStrategy);

//bcrypt = hash function
const rootdirectory: string = path.resolve(rootDir, 'client');
//express session
import session from 'express-session';
import sharedSession from 'express-socket.io-session';
import { debuglog } from "util";

//request時に実行するmiddleware function
app.use(express.static(rootdirectory));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var sessionMiddleware = session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(everyRequest);

function everyRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
	// console.log(req.user);
	if (req.user != "admin" && (req.originalUrl != '/login')) {
		passport.authenticate('local', {
			successRedirect: '/admin',
			failureRedirect: '/login'
		})(req, res, next);
		// console.log(req.user);
		functions.LOG('not logged in', 'not logged in');
	}
	else {
		if (ipList.includes(req.socket.remoteAddress!)) {
			functions.LOG(`Blacklisted-ip tried to access. IP: ${req.socket.remoteAddress}`, 'banned ip tried to access');
			// console.log('Blacklisted ip tried to access. IP: ', req.socket.remoteAddress);
			res.send('banned L');
			res.end();
		}
		else {
			if(!req.originalUrl.startsWith('/avatar/'))
				functions.LOG(`Request URL: ${req.originalUrl} \nIP: ${req.socket.remoteAddress}`, 'request url');
			next();
		}
	}
}


app.get('/', (req: express.Request, res: express.Response) => {
	res.sendFile('index.html', { root: rootdirectory });
})

app.get('/login', (req: express.Request, res: express.Response) => {
	res.sendFile('index.html', { root: rootdirectory });
})

app.post('/login', (req: express.Request, res: express.Response, next: express.NextFunction) => {
	// console.log(req.body);
	passport.authenticate('local', {
		successRedirect: '/admin',
		failureRedirect: '/login'
	})(req, res, next);
})
app.get('/admin', (req: express.Request, res: express.Response) => {
	res.sendFile('admin.html', { root: rootdirectory });
});

app.get('/avatar/id', (req: express.Request, res: express.Response) => {
	let avatarPath = path.resolve('/media/usb/compilerserver/accounts', req.query.id, 'avatar.png');
	fs.access(avatarPath, (err) => {
		if(err){
			res.sendFile(path.resolve(__dirname, 'guest.png'));
		}
		else{
			res.sendFile(avatarPath);
		}
	})
});

io.use(sharedSession(sessionMiddleware, {

}));
let logSize = 0, adminlogSize = 0;
fs.readFile(logJsonPath, (err, data) => {
	let temp = JSON.parse(data.toString() || "null");
	logSize = temp.length;
});
fs.readFile(adminlogJsonPath, (err, data) => {
	let temp = JSON.parse(data.toString() || "null");
	adminlogSize = temp.length;
})
fs.watchFile(logJsonPath, (curr: fs.Stats, prev: fs.Stats) => {
	fs.readFile(logJsonPath, (err, data) => {
		let temp = JSON.parse(data.toString() || "null");
		if(temp){
			io.sockets.emit('newLog', {
				value: temp.slice(logSize)
			});
			logSize = temp.length;
		}
	})
});
fs.watchFile(adminlogJsonPath, (curr: fs.Stats, prev: fs.Stats) => {
	fs.readFile(adminlogJsonPath, (err, data) => {
		let temp = JSON.parse(data.toString() || "null");
		if(temp){
			io.sockets.emit('newLog', {
				value: temp.slice(adminlogSize)
			});
			adminlogSize = temp.length;
		}
	})
});
io.sockets.on('connection', async (socket: any) => {
	let taskManagerTimer = setInterval(() => { functions.taskManager(socket); }, 1000);
	// console.log(JSON.stringify(socket.handshake.address));

	socket.on('command', async (input: any) => {
		functions.parseCommand(input.command, socket);
	});
	socket.on('logGet', async (input: any) => {
		functions.LOG(input, 'log filter');
		let serverFilter = functions.parseServerFilter(input.filter.server);
		let filteredLog: serverLog[] = [];
		let jsonLogs: Promise<serverLog[]>[] = [];
		if (serverFilter.main == true) {
			jsonLogs.push(functions.parseFilter('/home/pi/log.json', input.filter));
		}
		if (serverFilter.admin == true) {
			jsonLogs.push(functions.parseFilter('/home/pi/adminlog.json', input.filter));
		}
		Promise.all(jsonLogs).then((value: serverLog[][]) => {
			value.forEach((element: serverLog[]) => {
				filteredLog = filteredLog.concat(element);
			});
			// console.log(filteredLog[0]);
			filteredLog.sort((a, b) => {
				return b.timestamp - a.timestamp;
			})
			let logSize = filteredLog.length;
			filteredLog = filteredLog.slice(input.from - 1, input.until);
			// console.error(filteredLog);
			socket.emit('logReturn', {
				value: filteredLog,
				max: logSize
			});
		});
	});
	socket.on('usersGet', async (input: any) => {
		User.find({}, (err: any, docs: any[]) => {
			let users: userData[] = [];
			docs.forEach((element: any) => {
				let temp: userData = {
					id: element.username,
					username: element.displayName,
					avatar: "",
					email: element.email
				}
				users.push(temp);
			})
			socket.emit('usersReturn', {
				value: users
			})
		})
	});
	socket.on('blacklistGet', async (input: any) => {
		socket.emit('blacklistReturn', {
			value: ipList
		})
	});
	socket.on('blacklistAdd', async (input: any) => {
		ipList.push(input.value);
		let temp = { value: ipList };
		fs.writeFile('/home/pi/ipBlacklist.json', JSON.stringify(temp), (err: NodeJS.ErrnoException | null) => {
			if(err) console.error(err);
			else
			{
				functions.LOG(`${ipList.length + 1} blocked ip addresses.`, `${ipList.length + 1} blocked ip addresses.`);
			}
		});
	})
	socket.on('disconnect', () => {
		socket.removeAllListeners('command');
	})
});


// 404
app.use((req: express.Request, res: express.Response, next) => {
	res.status(404);
	res.sendFile('err404.html', { root: rootdirectory });
});

httpServer.listen(port, () => {
	functions.LOG('Server at https://rootlang.ddns.net', 'Server at https://rootlang.ddns.net');
})