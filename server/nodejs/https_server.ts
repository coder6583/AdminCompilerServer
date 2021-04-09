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
const http = require('http');
const httpServer = http.createServer(app);
const io = require('socket.io')(httpServer);
const port : number = 8080;
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
mongoose.connect('mongodb+srv://coder6583:curvingchicken@compilerserver.akukg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {console.log('connected to database.');});

mongoose.Promise = global.Promise;
//passport
import passport from 'passport';
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy( 
  {usernameField: 'loginId', passwordField: 'loginPassword'}, functions.loginCheck
));
passport.serializeUser((user: any, done) => {
  console.log(user, 'serialize');
  done(null, user);
})
passport.deserializeUser((user: any, done) => {
  console.log(user, 'deserialize');
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


//request時に実行するmiddleware function
app.use(express.static(rootdirectory));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
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

function everyRequest(req: express.Request, res: express.Response, next: express.NextFunction)
{
  console.log(req.user);
    if(req.user != "admin" && (req.originalUrl != '/login'))
    {
      passport.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/login'
      })(req,res,next);
      // console.log(req.user);
      console.log('not logged in');
    }
    else
    {
      if(ipList.includes(req.socket.remoteAddress!))
      {
        console.log('Blacklisted ip tried to access. IP: ', req.socket.remoteAddress);
        res.send('banned L');
        res.end();
      }
      else
      {
        console.log('Request URL: ', req.originalUrl, '\nIP:', req.socket.remoteAddress);
        next();
      }
    }
}


app.get('/', (req: express.Request, res: express.Response) => {
    res.sendFile('index.html', {root: rootdirectory});
})

app.get('/login', (req: express.Request, res: express.Response) => {
    res.sendFile('index.html', {root: rootdirectory});
})

app.post('/login', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(req.body);
  passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login'
  })(req,res,next);
})
app.get('/admin', (req: express.Request, res: express.Response) => {
    res.sendFile('admin.html', {root: rootdirectory});
})

io.use(sharedSession(sessionMiddleware, {

}));
io.sockets.on('connection', async (socket:any) => {
  let taskManagerTimer = setInterval(() => {functions.taskManager(socket);}, 1000);
  console.log(JSON.stringify(socket.handshake.address));
    socket.on('command', async (input: any) => {
      functions.parseCommand(input.command, socket);
    });
    socket.on('logGet', async (input: any) => {
      console.log(input);
      let serverFilter = functions.parseServerFilter(input.filter.server);
      let filteredLog: serverLog[] = [];
  ;
      // console.log(filterMainBool, filterAdminBool);
      if(serverFilter.main == true)
      {
        functions.parseFilter('/home/pi/log.json', input.filter).then((value: any) => {
          console.log(value);
          filteredLog.concat(value);
          if(serverFilter.admin == true)
          {
            functions.parseFilter('/home/pi/adminlog.json', input.filter).then((value: any) => {
              filteredLog.concat(value);
              console.log(filteredLog);
              socket.emit('logReturn', {
                value: filteredLog
              })
            });
          }

        });
      }
      else if(serverFilter.admin == true)
      {
        functions.parseFilter('/home/pi/adminlog.json', input.filter).then((value: any) => {
          filteredLog.concat(value);

          socket.emit('logReturn', {
            value: filteredLog
          })
        });
      }

    })
    socket.on('disconnect', () => {
      socket.removeAllListeners('command');
    })
});


// 404
app.use((req :express.Request, res :express.Response, next) => {
  res.status(404);
  res.sendFile('err404.html', {root: rootdirectory});
});

  httpServer.listen(port, () => {
    console.log('Server at https://rootlang.ddns.net');
  })