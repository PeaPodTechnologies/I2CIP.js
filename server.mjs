import { hostname } from 'os';
import { lookup } from 'dns';

import { createServer } from 'http';
import { Server } from 'socket.io';

import next from 'next';
import nextConfig from './next.config.mjs';

import { findSerialPort, MicroController, SimulatedController } from './api/controller.mjs';
// import { pushDebugMessage } from './api/firebase.mjs';
import ui, { _logRedirect, _errRedirect } from './api/ui.mjs';

// Redirect console.log/.error calls to ui.log/.err
console.log = _logRedirect;
console.error = _errRedirect;

// Options: SerialPort Message Logging
const _msg_print_delta = 100;
var _msg_print_count = 0;

// Options: Simulated Controller
const simulator = new SimulatedController({
  temperature: {
    min: 15,
    max: 35,
    interval: 2700,
  },
  humidity: {
    min: 40,
    max: 60,
    interval: 5100,
  },
});

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
    const _host = 'localhost'; // Hardcode failsafe HERE!
    host = _host;
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
        io.on('connection', (socket) => {
          ui.log('Socket.IO ++');
          socket.emit('json', {type: 'info', message: 'Debug Socket Start', _socket: 'server'});

          socket.on('disconnect', () => {
            ui.log('Socket.IO --');
          });
        });
        
        // 5A. Simulated DebugJson Controller
        simulator.start((msg) => {
          io.emit('json', {...msg, _socket: 'simulator'});
          io.emit('simulator', msg);
          // ui.info(`SIMULATOR JSON: ${JSON.stringify(msg)}`);
          // pushDebugMessage(msg, 'simulator');
        }).then(() => {
          ui.info(`Using DebugJSON Simulator: https://${ hostname }:${ port }/simulator/`);
        });
        
        // 5B. SerialPort DebugJson Controller
        ui.start('SerialPort: Scanning...');
        findSerialPort('usbserial').then((ports) => {
          if(ports.length === 0) { throw new DebugJsonSerialportError('No SerialPorts Found!'); }

          ui.succeed(`SerialPorts[${ports.length}]`);
          ports.forEach((port, i) => {
            console.info(`SerialPort[${i}]: ${port}`);
            const microcontroller = new MicroController(port);
            
            microcontroller.start((msg) =>  {
              io.emit('json', {...msg, _socket: msg.t ?? 'microcontroller'});
              io.emit(msg.t ?? 'microcontroller', msg);
              
              // pushDebugMessage(msg, msg.t ?? 'microcontroller');
              
              if (_msg_print_count % _msg_print_delta === 0) {
                ui.info(`CONTROLLER JSON[${_msg_print_count}]: ${JSON.stringify(msg)}`);
              }
              _msg_print_count++;
            }).catch((err) => {
              io.emit('json', {type: 'error', message: `Lost Controller: ${err}`, _socket: 'server'});
              ui.fail(err);
              // io.off('connection', handleSocketConnection);
              microcontroller.reset();
            }).then(() => {
              ui.succeed('DebugJSON Ready!');
            });
          });
        });
      });
    });
  });
})();
