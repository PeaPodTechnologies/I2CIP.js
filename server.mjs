import { hostname } from 'os';
import { lookup } from 'dns';

import { createServer } from 'http';
import { Server } from 'socket.io';

import next from 'next';
import nextConfig from './next.config.mjs';

import { findSerialPort, MicroController, CONTROLLER_REVISION } from './api/controller.mjs';
// import { pushDebugMessage, pushDebugMessages } from './api/firebase.mjs';
import ui, { _logRedirect, _errRedirect } from './api/ui.mjs';
import {DebugJsonSerialportError} from './api/errors.mjs';

// Redirect console.log/.error calls to ui.log/.err
console.log = _logRedirect;
console.error = _errRedirect;

// Options: SerialPort Message Logging
const _msg_print_delta = 1;
var _msg_print_count = 0;

// Helper: IPv4 Address Lookup (Fallback to 'localhost')
const ipv4Lookup = async () => {
  const h = hostname();
  if(!h) return 'localhost';
  return await new Promise((res) => {
    lookup(h, { family: 4, all: true }, (err, addrs) => {
      res((err || !addrs || !(addrs.length)) ? 'localhost' : addrs.find((a) => (a.address !== '127.0.0.1')).address);
    });
  });
};

(() => {
  // 1. IPv4 Lookup
  ui.start('IPv4: Lookup...');
  ipv4Lookup().then((host) => {
    ui.succeed(`IPv4: ${host}`);

    const port = 3001;
    // const _host = 'localhost'; // Hardcode failsafe HERE!
    // host = _host;
    const app = next({ dev: (process.env.NODE_ENV !== 'production'), hostname: host, port, conf: nextConfig });
    const handler = app.getRequestHandler();
    const server = createServer((req, res) => {
      handler(req, res);
    });

    // With friends like these, who needs a hearth? If only she had a hearthstone...

    // 2. Next.JS App and Server Main
    ui.start('Next.JS: Preparing...');
    app.prepare().then(() => {
      ui.succeed(`Next.JS: http://${host}:${port}/`);
      // 3. HTTP Server
      server.listen(port, host, () => {
        // 4. WebSockets
        const io = new Server(server, {
          cors: {
            origin: '*',
          },
        });
        
        // 5. SerialPort DebugJson Controller
        ui.start('SerialPort: Scanning...');
        findSerialPort('usbserial').then((ports) => {
          if(ports.length === 0) { throw new DebugJsonSerialportError('No SerialPorts Found!'); }

          ui.succeed(`SerialPorts[${ports.length}]`);
          ports.forEach((ser, i) => {
            console.info(`SerialPort[${i}]: ${ser}`);
            const microcontroller = new MicroController(ser);
            
            microcontroller.start((messages) =>  {
              // Emit to WebSockets
              messages.forEach((msg) => {
                io.emit('microcontroller', msg);
              });
              
              // Push to Firebase Realtime Database
              // pushDebugMessages(messages, 'microcontroller');
              
              // if (_msg_print_count % _msg_print_delta === 0) {
                ui.info(`CONTROLLER JSON[${_msg_print_count}]: ${JSON.stringify(messages[0])}`);
              // }
              _msg_print_count++;

              // const timestamp = messages.reduce((max, msg) => ((msg['timestamp'] ? (msg['timestamp'] > max ? msg['timestamp'] : max) : max)), 0);
              // if(timestamp) microcontroller.write({
              //   type: 'command',
              //   data: {
              //     'fqa': 8183,
              //     's': Math.floor(timestamp / 1000),
              //     'b': 2
              //   }
              // });

            }).catch((err) => {
              io.emit('server', {type: 'error', msg: `Lost Controller: ${err}`});
              ui.fail(err);
              // io.off('connection', handleSocketConnection);
              microcontroller.reset();
            }).then(() => {
              ui.succeed(`I2CIP.js Ready!`);

              var schedule = {};

              // 6. Socket.IO Connection Handler
              io.on('connection', (socket) => {
                ui.log('Socket.IO ++');

                setTimeout(() => {
                  ui.info(`Socket.IO: ${socket.id}`);
                  socket.emit('json', { type: 'info', msg: 'Server Start', _socket: 'server' }); // Open subsocket 'server'
                  socket.emit('json', { type: 'revision', msg: 'Microcontroller Revision Match', data: CONTROLLER_REVISION, _socket: 'microcontroller' }); // Open subsocket 'microcontroller'
                }, 1000);

                socket.on('disconnect', () => {
                  ui.log('Socket.IO --');
                });
                socket.on('serialinput', (data) => {
                  ui.info(`CONTROLLER INPUT: ${JSON.stringify(data)}`);
                  if(!data || !data.type || !data.data) {
                    ui.fail('CONTROLLER INPUT ERROR: Invalid Data');
                    socket.emit('server', {type: 'error', msg: 'Controller Input Error: Invalid Data'});
                    return;
                  }
                  try {
                    microcontroller.write({type: data.type, data: data.data});
                  } catch (err) {
                    ui.fail(`CONTROLLER INPUT ERROR: ${err}`);

                    socket.emit('server', {type: 'error', msg: `Controller TX Error: ${err}`});
                  }
                });

                socket.on('scheduler-post', (data) => {
                  ui.info(`SCHEDULER POST: ${JSON.stringify(data)}`);
                  if(!data || !data.interval || !data.instruction || !data.instruction.type || !data.instruction.data) {
                    ui.fail('SCHEDULER POST ERROR: Invalid Data');
                    socket.emit('server', {type: 'error', msg: 'Scheduler Post Error: Invalid Data'});
                    return;
                  }
                  const schedulerLabel = JSON.stringify(data.instruction);
                  if(schedule[schedulerLabel]) {
                    ui.info(`CONTROLLER INPUT SCHEDULE CLEARED: ${schedulerLabel}`);
                    clearInterval(schedule[schedulerLabel]);
                  }
                  if(typeof data.interval === 'number' && data.interval >= 100) {
                    ui.info(`CONTROLLER INPUT SCHEDULE: ${schedulerLabel} @${data.interval}ms`);
                    schedule[schedulerLabel] = setInterval(() => {
                      ui.info(`CONTROLLER INPUT SCHEDULE: ${schedulerLabel} @${data.interval}ms`);
                      try {
                        microcontroller.write({type: data.instruction.type, data: data.instruction.data});
                      } catch (err) {
                        ui.fail(`CONTROLLER INPUT ERROR: ${err}`);
                        socket.emit('server', {type: 'error', msg: `Controller TX Error: ${err}`});
                      }
                    }, data.interval);
                  }
                });

                socket.on('scheduler', (data) => {
                  ui.info(`SCHEDULER INPUT: ${JSON.stringify(data)}`);
                  
                });
              });
            });
          });
        });
      });
    });
  });
})();
