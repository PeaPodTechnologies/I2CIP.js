import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { 
  // SimulatedController, 
  MicroController
} from './api/controller.mjs';
import { _logRedirect } from './api/ui.mjs';
import ui from './api/ui.mjs';

console.log = _logRedirect;

// const DEBUGJSON_SIMULATOR_OPTIONS = {
//   temperature: {
//     min: 15,
//     max: 35,
//     interval: 2700,
//   },
//   humidity: {
//     min: 40,
//     max: 60,
//     interval: 5100,
//   },
// };

const microcontroller = new MicroController('/dev/cu.wchusbserial57990084681');
// const simulator = new SimulatedController(DEBUGJSON_SIMULATOR_OPTIONS);

const dev = process.env.NODE_ENV !== 'production';
const hostname = '192.168.2.43'// 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  ui.start('Next.JS...');
  const server = createServer((req, res) => {
    handler(req, res);
  });

  server.listen(port, hostname, () => {
    ui.succeed(`Next.JS: http://${hostname}:${port}`);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  const handleSocketConnection = (socket) => {
      ui.info('Socket.io++');
      socket.on('disconnect', () => {
        ui.info('Socket.io--');
      });
    };

  const _msg_print_delta = 10;
  var _msg_print_count = 0;

  microcontroller.start((msg) =>  {
    io.emit('json', {...msg, _socket: msg.t ?? 'microcontroller'});
    io.emit(msg.t ?? 'microcontroller', msg);
    if (_msg_print_count % _msg_print_delta === 0) {
      ui.info(`CONTROLLER JSON[${_msg_print_count}]: ${JSON.stringify(msg)}`);
      _msg_print_count++;
    }
  }).catch((err) => {
    io.emit('json', {type: 'error', message: `Lost Controller: ${err}`, _socket: 'microcontroller'});
    ui.fail(err);
    io.off('connection', handleSocketConnection);
    microcontroller.reset();
  }).then(() => {
    io.on('connection', handleSocketConnection);
  });
});

process.on('exit', () => {
  ui.info('Process exiting...');
  microcontroller.stop();
});

process.on('SIGINT', () => {
  ui.info('Process interrupted...');
  process.exit();
});

process.on('SIGTERM', () => {
  ui.info('Process terminated...');
  process.exit();
});