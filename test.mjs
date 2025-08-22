import { getSerialPorts } from './api/controller.mjs';

getSerialPorts().then(ports => {
  console.log('Available serial ports:');
  ports.forEach(port => {
    console.log(` - ${port}`);
  });
}).catch(err => {
  console.error('Error listing serial ports:', err);
});
