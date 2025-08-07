import { Paper, List, ListItem, ListItemText, Button } from '@mui/material';
import { FC } from 'react';
import { useDevices } from '../contexts/devices';
import { useSocket } from '../contexts/socket';
import { fqaToString } from '../utils';

const Pinger: FC = () => {
  const { socket } = useSocket();
  const { devices } = useDevices();

  const pingDevice = (fqa: number) => {
    socket.emit('serialinput', {
      type: 'command',
      data: {
        fqa: Math.floor(fqa),
      },
    });
  };

  return devices ? (
    <Paper elevation={3} square={false} sx={{ padding: 2 }}>
      <div>Pinger Placeholder</div>
      {Array.isArray(devices) && devices.length > 0 ? (
        <List>
          {devices.map((m) =>
            Object.entries(m).map(([id, fqas]) =>
              fqas && Array.isArray(fqas) ? (
                <>
                  <ListItem key={id}>
                    <ListItemText primary={id} />
                  </ListItem>
                  {fqas.map((fqa) => (
                    <ListItem key={`${id}-${fqa}`}>
                      <ListItemText primary={fqaToString(fqa)} />
                      <Button
                        onClick={() => {
                          pingDevice(fqa);
                        }}
                        disabled={!socket}
                      >
                        Ping
                      </Button>
                    </ListItem>
                  ))}
                </>
              ) : null
            )
          )}
        </List>
      ) : (
        <div>No devices found</div>
      )}
    </Paper>
  ) : null;
};

export default Pinger;
