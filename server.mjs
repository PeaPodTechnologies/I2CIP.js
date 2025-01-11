// Imports: Web Server
import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import nextConfig from './next.config.mjs';

// Imports: Console UI, Controller API, SerialPort, etc.
import ui from './api/ui.mjs';
import { findSerialPort, MicroController, SimulatedController } from './api/controller.mjs';
import { DebugJsonSerialportError } from './api/errors.mjs';

// Redirect console.log/.error calls to ui.log/.err
import { _logRedirect, _errRedirect } from './api/ui.mjs';
console.log = _logRedirect;
console.error = _errRedirect;

// Options: Web Server
const dev = process.env.NODE_ENV !== 'production';
const hostname = '192.168.2.43'; // 'localhost';
const port = 3000;

// Options: SerialPort Message Logging
const _msg_print_delta = 100;
var _msg_print_count = 0;

// Options: Simulated Controller
const DEBUGJSON_SIMULATOR_OPTIONS = {
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
};
const simulator = new SimulatedController(DEBUGJSON_SIMULATOR_OPTIONS);

// Static Next.JS App
const app = next({ dev, hostname, port, conf: nextConfig });
const handler = app.getRequestHandler();

// Start: Next.JS App
ui.start('Next.JS...');
app.prepare().then(() => {
  
  // Start: HTTP Server
  const server = createServer((req, res) => {
    handler(req, res); // Route all requests to Next.JS app handler
  });
  server.listen(port, hostname, () => {
    ui.succeed(`Next.JS: http://${hostname}:${port}/`);
    setTimeout(() => {
      ui.info('Socket.IO Open');

      // Start: WebSockets
      const io = new Server(server, {
        cors: {
          origin: '*',
        },
      });

      setTimeout(() => {
        io.on('connection', (socket) => {
          ui.info('Socket.IO ++');
          socket.emit('json', {type: 'info', message: 'Debug Socket Start', _socket: 'server'});
          socket.on('disconnect', () => {
            ui.info('Socket.IO --');
          });
        });

        simulator.start((msg) => {
          io.emit('json', {...msg, _socket: 'simulator'});
          io.emit('simulator', msg);
          // ui.info(`SIMULATOR JSON: ${JSON.stringify(msg)}`);
        }).then(() => {
          ui.info(`Using DebugJSON Simulator: https://${ hostname }:${ port }/simulator/`);
        });

        ui.start('SerialPort...');

        findSerialPort('usbserial').then((ports) => {
          if(ports.length === 0) {
            ui.fail('SerialPort[0]');
            throw new DebugJsonSerialportError('No USB SerialPort Found');
          }
          ui.succeed(`SerialPort[${ports.length}]: {${ports.join(', ')}}`);
          ports.forEach((port, i) => {
            console.info(`SerialPort[${i}]: ${port}`);
            const microcontroller = new MicroController(port);

            process.on('exit', () => { 
              ui.info('Process exiting...');
              microcontroller.stop();
            });

            microcontroller.start((msg) =>  {
              io.emit('json', {...msg, _socket: msg.t ?? 'microcontroller'});
              io.emit(msg.t ?? 'microcontroller', msg);
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
      }, 2000); // Wait a bit and start the controller
    }, 1000); 
  });
});