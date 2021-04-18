import fs from 'fs';
const {exec} = require('child_process');
function mountUsb(accountsDir: string)
{
    fs.access(accountsDir, (err) => {
        if(err && err.code == 'ENOENT')
        {
          fs.access('/media/pi/A042-416A', (err) => {
            if(!err)
            {
              exec('sudo umount /media/pi/A042-416A', () => {
                exec('sudo mount /dev/sda1 /media/usb', () => {
                  LOG('mounted usb', 'status');
                })
              });
            }
            else
            {
              exec('sudo mount /dev/sda1 /media/usb', () => {
                LOG('mounted usb', 'status')
              });
            }
          })
        }
    })
}
async function updateIpBlacklist(blacklistDir: string)
{
    let ipList: string[] = [];
    return new Promise((resolve, reject) => {
      fs.readFile(blacklistDir, (err, data) => {
          if(err)
          {
            LOG('Could not read blacklist.', 'status');
          }
          else
          {
            let blacklistData: string = data.toString();
            ipList = blacklistData.split(';\n');
            LOG(ipList.length + ' blocked ip addresses.', 'status');
          }
          resolve(ipList);
      });
    })
}
import bcrypt from 'bcrypt';
function loginCheck(username: string, password: string, done: any)
{
    const hash = "$2b$10$ieCh/0DZR.B/T2pAwzNHVO757UQ1PtTpkv9XdF/T51ag1KCkMstXi";
    LOG('Login Attempt', 'login');
    if(username == 'admin')
    {
      bcrypt.compare(password, hash, (err, isMatch) => {
        if(err) LOG(err, 'login');
        if(isMatch)
        {
          LOG('logged in!', 'login');
          return done(null, username);
        }
        else 
        {
          return done(err, false, {message: 'password incorrect'});
        }
      })
    }
    else if(username != 'admin')
    {
      return done(null, false, {message: 'username incorrect'});
    }
}
import si from 'systeminformation';
import os from 'os-utils';
function taskManager(socket: any)
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
const io = require('socket.io');
function parseCommand(command: string, socket: any)
{
    let words = command.split(' ');
    LOG(words[0], 'debug');
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
      LOG('aaaa', 'debug');
      socket.emit('result', {
        success: true,
        result: 'list'
      });
    }
}
function parseServerFilter(filter: string[])
{
    if(filter.length == 0)
    {
        return {main: true, admin: true};
    }
    else if(filter.length == 1)
    {
        if(filter.includes('main'))
        {
            return {main: true, admin: false};
        }
        else if(filter.includes('admin'))
        {
            return {main: false, admin: true};
        }
    }
    else if(filter.length == 2)
    {
        return {main: true, admin: true};
    }
    else
    {
      return {main: true, admin: true};
    }
}
async function parseFilter(jsonPath: string, filter: logFilter)
{
  console.error(filter);
  return new Promise((resolve, reject) => {
    let filteredLog: serverLog[] = [];
    fs.readFile(jsonPath, (err: any, data: any) => {
      if(err) console.error(err);
      else
      {
        let logArray = JSON.parse(data||"null");
        logArray.forEach((element: any) => {
          if(filter.before && filter.after)
          {
            if(!(filter.before <= element.timestamp && element.timestamp <= filter.after))
            {
              return;
            }
          }
          if(filter.category.length > 0)
          {
            let inCategory = false;
            filter.category.forEach((cat: any) => {
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
          if(filter.keyword.length > 0)
          {
            if(!filter.keyword.every((s: string) => element.value.includes(s)))
            {
              return;
            }
          }
          if(element.value == "")
          {
            return;
          }
          filteredLog.push(element);
        });
      }
      resolve(filteredLog);
    })
  })
}
function LOG(log: any, title: string)
{
  if(typeof log === 'object' && log != null)
    console.log(`${title}(${JSON.stringify(log)})\``);
  else
  console.log(`${title}(${log})\``);
}
module.exports = {mountUsb, updateIpBlacklist, loginCheck, taskManager, parseCommand, parseServerFilter, parseFilter, LOG};