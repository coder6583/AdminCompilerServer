#!/usr/bin/env node

import { ExpressionStatement } from "typescript";

import express from 'express';
import fs from 'fs';
import { Stream } from "stream";
const path = require('path');
const {exec} = require('child_process');
const app: express.Express = express();
//https settings
const rootDir: string = path.resolve(__dirname, '../../');
const http = require('http');
//http to https auto redirection
// const http = require('http');
// http.createServer((express()).all("*", function (request, response) {
//   response.redirect(`https://${request.hostname}${request.url}`);
// })).listen(80);
const httpServer = http.createServer(app);
const io = require('socket.io')(httpServer);
const port : number = 8080;
//mount usb
const accountsDir: string = '/media/usb/compilerserver/accounts/';
fs.access(accountsDir, (err) => {
  if(err && err.code == 'ENOENT')
  {
    fs.access('/media/pi/A042-416A', (err) => {
      if(!err)
      {
        exec('sudo umount /media/pi/A042-416A', () => {
          exec('sudo mount /dev/sda1 /media/usb', () => {
            console.log('mounted usb');
          })
        });
      }
      else
      {
        exec('sudo mount /dev/sda1 /media/usb', () => {
          console.log('mounted usb')
        });
      }
    })
  }
})
//ip filter
var ipList: Array<string>;
fs.readFile('/home/pi/ipBlacklist', (err, data) => {
  if(err)
  {
    console.log('Could not read blacklist.');
  }
  else
  {
    let blacklistData: string = data.toString();
    ipList = blacklistData.split(';\n');
    console.log(ipList.length + ' blocked ip addresses.');
  }
});
// const ipfilter = require('express-ipfilter').IpFilter;
fs.watchFile('/home/pi/ipBlacklist', (curr: any, prev: any) => {
  fs.readFile('/home/pi/ipBlacklist', (err, data) => {
    if(err)
    {
      console.log('Could not read ipBlacklist.');
    }
    else
    {
      let blacklistData: string = data.toString();
      ipList = blacklistData.split(';\n');
      console.log(ipList);
      // app.use(ipfilter(ipList));
    }
  });
});

//database (mongoose)
import mongoose from 'mongoose';
const User: mongoose.Model<any, any> = require('./database');
mongoose.connect('mongodb+srv://coder6583:curvingchicken@compilerserver.akukg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {console.log('connected');});

mongoose.Promise = global.Promise;
//passport
const hash = "$2b$10$aha8xyjAjp971NX3MXzq.Ouj6YhstYcBCXlsdrpBB5xrJxjI5RoOe";
import passport from 'passport';
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy( 
  {usernameField: 'loginId', passwordField: 'loginPassword'}, (username: string, password: string, done: any) => {
    console.log('hello');
    if(username == 'admin')
    {
      bcrypt.compare(password, hash, (err, isMatch) => {
        if(err) console.log(err);
        if(isMatch)
        {
          console.log('logged in!');
          return done(null, username);
        }
        else 
        {
          return done(err, false, {message: 'password incorrect'});
        }
      })
    }
  }
));
passport.serializeUser((user: any, done) => {
  console.log(user, 'serialize');
  done(null, user);
})
passport.deserializeUser((user: any, done) => {
  console.log(user, 'deserialize');
  done(null, user);
  // User.findById(id, (err: any, user: any) => {
  //   // console.log(user.id);
  //   done(err, user);
  // })
})

//Login with Google
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(GoogleStrategy);

//bcrypt = hash function
import bcrypt from 'bcrypt';
const rootdirectory: string = path.resolve(rootDir, 'client');
//express session
import session from 'express-session';
import sharedSession from 'express-socket.io-session';

//task manager
import si from 'systeminformation';
import os from 'os-utils';

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
    // else if(req.session.passport.user != "admin")
    // {
    //   console.log('a');
    //   res.sendFile('index.html', {root: rootdirectory});
    //   console.log(req.session.passport.user);
    //   next();
    // }
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
io.sockets.on('connection', (socket:any) => {

  function taskManager()
  {
    os.cpuUsage((percentage) => {
      // console.log('CPU: ' + percentage * 100 + '%');
      socket.emit('cpu-usage', {
        percentage: percentage * 100
      })
    });
    si.mem().then((data: any) => {
      // console.log('Memory: ' + (100 - data.available / data.total * 100));
      socket.emit('memory-usage', {
        percentage: (100 - data.available / data.total * 100),
        total: data.total,
        using: data.total - data.available,
      });
    })
    si.networkStats().then((data: any) => {
      // console.log('Received:', data[0].rx_sec, 'Transmitted: ', data[0].tx_sec);
      socket.emit('network-usage', {
        received: data[0].rx_sec,
        transmitted: data[0].tx_sec
      })
    })
    si.fsStats().then((data: any) => {
      // console.log('Read: ',data.rx_sec, 'Wrote: ', data.wx_sec);
      socket.emit('disk-usage', {
        read: data.rx_sec,
        write: data.wx_sec
      })
    })
  }
  let taskManagerTimer = setInterval(() => {taskManager();}, 1000);
  console.log(JSON.stringify(socket.handshake.address));
    socket.on('command', async (input: any) => {
      let words = input.command.split(' ');
      console.log(words[0]);

      //update
      if(words[0] == 'update')
      {
        if(words.length == 1)
        {
          socket.emit('result', {
            success: false,
            result: 'アップデートするサーバーを選んでください。(main, admin)'
          });
        }
        else if(words.length > 2)
        {
          socket.emit('result', {
            success: false,
            result: 'パラメターが多すぎます。'
          })
        }
        else if(words[1] == 'main')
        {
          exec('git -C /home/pi/Compiler stash', (err: NodeJS.ErrnoException| null, stdout: any, stderr: any) => {
            if(err) 
              socket.emit('result', {
                success: false,
                result: 'スタッシュ失敗'
              });
            else
              socket.emit('result', {
                success: true,
                result: 'スタッシュ失敗'
              });
            exec('git -C /home/pi/Compiler pull', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
              if(err)
                socket.emit('result', {
                  success: false,
                  result: stdout + ' ' + stderr
                });
              else
                socket.emit('result', {
                  success: true,
                  result: stdout + ' ' + stderr
                })
              exec('chmod +x /home/pi/Compiler/server/nodejs/https_server.js', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
                if(err)
                  socket.emit('result', {
                    success: false,
                    result: stdout + ' ' + stderr
                  });
                else
                  socket.emit('result', {
                    success: true,
                    result: stdout + ' ' + stderr
                  })
              })
            })
          })
        }
        else if(words[1] == 'admin')
        {
          exec('git -C /home/pi/AdminCompilerServer stash', (err: NodeJS.ErrnoException| null, stdout: any, stderr: any) => {
            if(err) 
              socket.emit('result', {
                success: false,
                result: 'スタッシュ失敗'
              });
            else
              socket.emit('result', {
                success: true,
                result: 'スタッシュ失敗'
              });
            exec('git -C /home/pi/AdminCompilerServer pull', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
              if(err)
                socket.emit('result', {
                  success: false,
                  result: stdout + '\n' + stderr
                });
              else
                socket.emit('result', {
                  success: true,
                  result: stdout + '\n' + stderr
                })
              exec('chmod +x /home/pi/AdminCompilerServer/server/nodejs/https_server.js', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
                if(err)
                  socket.emit('result', {
                    success: false,
                    result: stdout + '\n' + stderr
                  });
                else
                  socket.emit('result', {
                    success: true,
                    result: stdout + '\n' + stderr
                  })
              })
            })
          })
        }
        else if(words[1] != 'main' && words[1] != 'admin')
        {
          socket.emit('result', {
            success: false,
            result: 'アップデートするサーバーを選んでください。(main, admin)'
          });
        }
        else
        {
          socket.emit('result', {
            success: false,
            result: '変なことしないでください'
          });
        }
      }
      //restart
      else if(words[0] == 'restart')
      {
        if(words.length == 1)
        {
          socket.emit('result', {
            success: false,
            result: '再起動するサーバーを選んでください。(main, admin)'
          });
        }
        else if(words.length > 2)
        {
          socket.emit('result', {
            success: false,
            result: 'パラメターが多すぎます。'
          })
        }
        else if(words[1] == 'main')
        {
          exec('sudo systemctl restart compilerserver', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
            if(err)
              socket.emit('result', {
                success: false,
                value: stdout + '\n' + stderr
              })
            else
              socket.emit('result', {
                success: true,
                value: '再起動成功'
              })
          });
        }
        else if(words[1] == 'admin')
        {
          exec('sudo systemctl restart admincompilerserver', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
            if(err)
              socket.emit('result', {
                success: false,
                value: stdout + '\n' + stderr
              })
            else
              socket.emit('result', {
                success: true,
                value: '再起動成功'
              })
          });
        }
        else if(words[1] != 'main' && words[1] != 'admin')
        {
          socket.emit('result', {
            success: false,
            result: '再起動するサーバーを選んでください。(main, admin)'
          });
        }
        else
        {
          socket.emit('result', {
            success: false,
            result: '変なことしないでください'
          });
        }
      }
      //start
      else if(words[0] == 'start')
      {
        if(words.length == 1)
        {
          socket.emit('result', {
            success: false,
            result: '起動するサーバーを選んでください。(main, admin)'
          });
        }
        else if(words.length > 2)
        {
          socket.emit('result', {
            success: false,
            result: 'パラメターが多すぎます。'
          })
        }
        else if(words[1] == 'main')
        {
          exec('sudo systemctl start compilerserver', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
            if(err)
              socket.emit('result', {
                success: false,
                value: stdout + '\n' + stderr
              })
            else
              socket.emit('result', {
                success: true,
                value: '起動成功'
              })
          });
        }
        else if(words[1] == 'admin')
        {
          exec('sudo systemctl start admincompilerserver', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
            if(err)
              socket.emit('result', {
                success: false,
                value: stdout + '\n' + stderr
              })
            else
              socket.emit('result', {
                success: true,
                value: '起動成功'
              })
          });
        }
        else if(words[1] != 'main' && words[1] != 'admin')
        {
          socket.emit('result', {
            success: false,
            result: '起動するサーバーを選んでください。(main, admin)'
          });
        }
        else
        {
          socket.emit('result', {
            success: false,
            result: '変なことしないでください'
          });
        }
      }
      //stop
      else if(words[0] == 'stop')
      {
        if(words.length == 1)
        {
          socket.emit('result', {
            success: false,
            result: '停止するサーバーを選んでください。(main, admin)'
          });
        }
        else if(words.length > 2)
        {
          socket.emit('result', {
            success: false,
            result: 'パラメターが多すぎます。'
          })
        }
        else if(words[1] == 'main')
        {
          exec('sudo systemctl stop compilerserver', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
            if(err)
              socket.emit('result', {
                success: false,
                value: stdout + '\n' + stderr
              })
            else
              socket.emit('result', {
                success: true,
                value: '停止成功'
              })
          });
        }
        else if(words[1] == 'admin')
        {
          exec('sudo systemctl stop admincompilerserver', (err: NodeJS.ErrnoException| null, stdout: string, stderr: string) => {
            if(err)
              socket.emit('result', {
                success: false,
                value: stdout + '\n' + stderr
              })
            else
              socket.emit('result', {
                success: true,
                value: '停止成功'
              })
          });
        }
        else if(words[1] != 'main' && words[1] != 'admin')
        {
          socket.emit('result', {
            success: false,
            result: '停止するサーバーを選んでください。(main, admin)'
          });
        }
        else
        {
          socket.emit('result', {
            success: false,
            result: '変なことしないでください'
          });
        }
      }
      else if(words[0] == 'list')
      {
        console.log('aaaa');
        socket.emit('result', {
          success: true,
          result: 'list'
        });
      }
    });
    socket.on('logGet', async (input: any) => {
      console.log(input);
      let filterMainBool = false;
      let filterAdminBool = false;
      if(!input.filter.server)
      {
        filterMainBool = true;
        filterAdminBool = true;
      }
      else if(input.filter.server)
      {
        input.filter.server.forEach((element: any) => {
          if(element == "main")
          filterMainBool = true;
          else if(element == "admin")
          filterAdminBool = true;
        });
      }
      let filteredLog: serverLog[] = [];
      console.log(filterMainBool, filterAdminBool);
      if(filterMainBool == true)
      {
        fs.readFile('/home/pi/log.json', (err: any, data: any) => {
          if(err) console.error(err);
          else
          {
            let logArray = JSON.parse(data);
            logArray.forEach((element: any) => {
              if(input.filter.before && input.filter.after)
              {
                console.log('time');
                if(!(input.filter.before <= element.timestamp && element.timestamp <= input.filter.after))
                {
                  console.log('not in between');
                  return;
                }
              }
              if(input.filter.category.length > 0)
              {
                console.log('category');
                let inCategory = false;
                input.filter.category.forEach((cat: any) => {
                  if(element.category == cat)
                  {
                    inCategory = true;
                  }
                });
                if(inCategory == false)
                {
                  return;
                }
              }
              if(input.filter.keyword.length > 0)
              {
                console.log('keyword');
                let hasKeyword = false;
                input.filter.keyword.forEach((keyword: any) => {
                  if(element.value.includes(keyword))
                  {
                    hasKeyword = true;
                  }
                });
                if(hasKeyword == false)
                {
                  return;
                }
              }
              console.log('i made it');
              filteredLog.push(element);
            });
          }
        })
      }
      if(filterMainBool == true)
      {
        fs.readFile('/home/pi/adminlog.json', (err: any, data: any) => {
          if(err) console.error(err);
          else
          {
            let logArray = JSON.parse(data);
            logArray.forEach((element: any) => {
              if(input.filter.before && input.filter.after)
              {
                console.log('time');
                if(!(input.filter.before <= element.timestamp && element.timestamp <= input.filter.after))
                {
                  return;
                }
              }
              if(input.filter.category.length > 0)
              {
                console.log('category');
                let inCategory = false;
                input.filter.category.forEach((cat: any) => {
                  if(element.category == cat)
                  {
                    inCategory = true;
                  }
                });
                if(inCategory == false)
                {
                  return;
                }
              }
              if(input.filter.keyword.length > 0)
              {
                console.log('keyword');
                let hasKeyword = false;
                input.filter.keyword.forEach((keyword: any) => {
                  if(element.value.includes(keyword))
                  {
                    hasKeyword = true;
                  }
                });
                if(hasKeyword == false)
                {
                  return;
                }
              }
              filteredLog.push(element);
            });
          }
        })
      }
      console.log(filteredLog);
      socket.emit('logReturn', {
        value: filteredLog
      })
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