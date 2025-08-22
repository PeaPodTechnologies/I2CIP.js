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
import { appendFileSync } from 'fs';

// Redirect console.log/.error calls to ui.log/.err
console.log = _logRedirect;
console.error = _errRedirect;

// Options: SerialPort Message Logging
const _msg_print_delta = 1;
var _msg_print_count = 0;

var schedule = {}; // { [key: instruction string]: NodeJS.Timeout} - Scheduled tasks
var linker = {};
// var linker = {encoder: [{key: 's', cast: 'number', eval: 'value * (-15)', instruction: {type: 'command', data: {fqa: 8183, b: 3}}}]}; // { [key: `telemetry key`]: { `instruction`: object, `key`: string, `cast`: 'string' | 'number' | 'boolean' }[] } - On `telemetry key`, send {...`instruction`, [`key`]: telemetry value as `cast`}

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

const linkerTyper = (value, cast)  => {
  if(cast === 'string') return String(value);
  if(cast === 'number') return Number(value);
  if(cast === 'boolean') return Boolean(value);
  return undefined;
};

const linkerChecker = (value, cast) => {
  if(cast === 'string') return typeof value === 'string';
  if(cast === 'number') return typeof value === 'number' && !isNaN(value);
  if(cast === 'boolean') return typeof value === 'boolean';
  return false;
};

const linkerEvaluator = (value, evalStr) => {
  if(!evalStr || typeof evalStr !== 'string') return value;
  try {
    return eval(evalStr.replace(/value/g, value));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return undefined;
  }
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

                appendFileSync(`logs/${(new Date()).toISOString().split('T')[0]}.txt`, JSON.stringify(msg) + '\n');

                // LINKER HANDLER

                if(msg.data) {
                  Object.keys(linker).forEach((key) => {
                    linker[key].forEach((item, index) => {
                      if(msg.data[key] !== undefined) {
                        const evalStr = item.eval;
                        const cast = item.cast;
                        const value = linkerTyper(linkerEvaluator(msg.data[key], evalStr), cast);
                        if(!linkerChecker(value, cast)) {
                          ui.fail(`LINKER ERROR: Invalid Type ${cast} for ${key} -> ${value} (${typeof value})`);
                          return; // Next key
                        }
                        const instruction = { ...item.instruction, data: { ...item.instruction.data, [item.key]: value } };
                        ui.info(`LINKER: ${key}: ${msg.data[key]} -> '${evalStr}' as ${cast} = ${value} -> ${JSON.stringify(instruction)}`);
                        try {
                          microcontroller.write(instruction);
                        } catch (err) {
                          ui.fail(`LINKER ERROR: ${err}`);
                          io.emit('server', {type: 'error', msg: `Linker TX Error: ${err}`});
                          return; // Next key
                        }
                      }
                    });
                  });
                }
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
              ui.succeed('I2CIP.js Ready!');

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

                // SERIAL INPUT SOCKET HANDLERS

                socket.on('serialinput', (data, callback) => {
                  ui.info(`CONTROLLER INPUT: ${JSON.stringify(data)}`);
                  if(!data || !data.type || !data.data) {
                    ui.fail('CONTROLLER INPUT ERROR: Invalid Data');
                    socket.emit('server', {type: 'error', msg: 'Controller Input Error: Invalid Data'});
                    callback({error: 'Invalid Serial Data'});
                    return;
                  }
                  try {
                    microcontroller.write({type: data.type, data: data.data});
                  } catch (err) {
                    ui.fail(`CONTROLLER INPUT ERROR: ${err}`);

                    socket.emit('server', {type: 'error', msg: `Controller TX Error: ${err}`});
                    callback({error: `Controller TX Error: ${err}`});
                    return;
                  }
                  callback();
                });

                // SCHEDULER SOCKET HANDLERS

                socket.on('scheduler-post', (data, callback) => {
                  ui.info(`SCHEDULER POST: ${JSON.stringify(data)}`);
                  if(!data || !data.interval || !data.instruction || !data.instruction.type || !data.instruction.data) {
                    ui.fail('SCHEDULER POST ERROR: Invalid Data');
                    socket.emit('server', {type: 'error', msg: 'Scheduler Post Error: Invalid Data'});
                    callback({error: 'Invalid Scheduler Data'});
                    return;
                  }
                  const schedulerLabel = JSON.stringify(data.instruction);
                  if(schedule[schedulerLabel]) {
                    ui.info(`CONTROLLER INPUT SCHEDULE CLEARED: ${schedulerLabel}`);
                    clearInterval(schedule[schedulerLabel]);
                    delete schedule[schedulerLabel];
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
                        clearInterval(schedule[schedulerLabel]);
                        delete schedule[schedulerLabel];

                        callback({error: `Controller TX Error: ${err}`});
                        return;
                      }
                    }, data.interval);
                    callback();
                  }
                });

                socket.on('scheduler-get', (data, callback) => {
                  ui.info('SCHEDULER GET');
                  callback(Object.keys(schedule));
                });

                socket.on('scheduler-clear', (key, callback) => {
                  ui.info(`SCHEDULER CLEAR: ${key}`);
                  if(!schedule[key]) {
                    ui.fail(`SCHEDULER CLEAR ERROR: No such key "${key}"`);
                    socket.emit('server', {type: 'error', msg: `Scheduler Clear Error: No such key "${key}"`});
                    callback({error: `No such key "${key}"`});
                    return;
                  }
                  clearInterval(schedule[key]);
                  delete schedule[key];
                  callback();
                });

                // LINKER SOCKET HANDLERS

                socket.on('linker-post', (data, callback) => {
                  ui.info(`LINKER POST: ${JSON.stringify(data)}`);
                  if(!data || !data.label || !data.key || !data.cast || !data.instruction || !data.eval || !data.instruction.type || !data.instruction.data) {
                    ui.fail('LINKER POST ERROR: Invalid Data');
                    socket.emit('server', {type: 'error', msg: 'Linker Post Error: Invalid Data'});
                    callback({error: 'Invalid Linker Data'});
                    return;
                  }
                  if(!linker[data.label]) linker[data.label] = [];
                  linker[data.label].push({
                    instruction: {
                      type: data.instruction.type,
                      data: {
                        ...data.instruction.data,
                        [data.key]: undefined
                      } 
                    }, 
                    key: data.key, 
                    eval: data.eval, 
                    cast: data.cast
                  });
                  callback();
                });

                socket.on('linker-get', (data, callback) => {
                  ui.info('LINKER GET');
                  callback(linker);
                });

                socket.on('linker-clear', (label, instruction, callback) => {
                  ui.info(`LINKER CLEAR: ${label} ${JSON.stringify(instruction)}`);
                  if(linker[label]) {
                    linker[label] = linker[label].filter((item) => {
                      return !(item.instruction.type === instruction.type && JSON.stringify(item.instruction.data) === JSON.stringify(instruction.data));
                    });
                  }
                  callback();
                });
              });
            });
          });
        });
      });
    });
  });
})();
