'use client';

import { FC, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { useDevices } from '../contexts/devices';
import { useSocket } from '../contexts/socket';

// export type DeviceTreeProps = {
//   socket?: string;
//   // messages?: DebugJsonMessage[];
//   // setNumData?: (n: number) => void;
// };

const DeviceTree: FC = () => {
  const { devices } = useDevices();
  const { socket } = useSocket();
  const [rebuild, setRebuild] = useState(false);

  return (
    //devices ? (
    <Paper elevation={3} square={false} sx={{ padding: 2 }}>
      <Typography variant="h6">Device Tree</Typography>
      {Array.isArray(devices) && devices.length > 0 ? (
        <List>
          {devices.map((m) =>
            Object.entries(m).map(([id, fqas]) => (
              <ListItem key={id}>
                <ListItemText primary={id} secondary={fqas.join(', ')} />
              </ListItem>
            ))
          )}
        </List>
      ) : (
        <Typography variant="subtitle1">No devices found</Typography>
      )}
      <Box sx={{ m: 1, marginTop: 2 }}>
        Rebuild?
        <Checkbox
          checked={rebuild}
          onChange={(e) => setRebuild(e.target.checked)}
        />
        <Button
          variant="contained"
          disabled={!socket}
          onClick={() => {
            if (socket) {
              socket.emit('serialinput', {
                type: 'command',
                data: { rebuild: true },
              });
            }
          }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  ); // : null;
};

export default DeviceTree;
