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
  TextField,
  Typography,
} from '@mui/material';
import { useDevices } from '@/contexts/devices';
import { useSocket } from '@/contexts/socket';

// export type DeviceTreeProps = {
//   socket?: string;
//   // messages?: DebugJsonMessage[];
//   // setNumData?: (n: number) => void;
// };

const DeviceTree: FC = () => {
  const { devices } = useDevices();
  const { socket } = useSocket();
  const [rebuild, setRebuild] = useState(false);

  const [isInterval, setIsInterval] = useState<boolean>(false);
  const [interval, _setInterval] = useState<number>(0);

  const handleRebuild = () => {
    const instruction = {
      type: 'command',
      data: {
        rebuild,
      },
    };
    if (isInterval && interval > 1) {
      socket.emit('scheduler-post', {
        interval: interval * 1000,
        instruction,
      });
    } else {
      socket.emit('serialinput', instruction);
    }
  };

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
      <Box
        component="form"
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          '& .MuiTextField-root': { m: 1, width: '25ch' },
        }}
        noValidate
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault(); // Prevents page refresh
        }}
      >
        <Typography>Rebuild?</Typography>
        <Checkbox
          checked={rebuild}
          onChange={(e) => setRebuild(e.target.checked)}
        />
        <Typography>Schedule?</Typography>
        <Checkbox
          checked={isInterval}
          onChange={(e) => setIsInterval(e.target.checked)}
        />
        {isInterval ? (
          <TextField
            label="Interval (Seconds)"
            type="number"
            value={interval ?? ''}
            error={interval <= 0}
            onChange={(e) => _setInterval(Number(e.target.value))}
          />
        ) : null}
        <Button variant="contained" disabled={!socket} onClick={handleRebuild}>
          Send
        </Button>
      </Box>
    </Paper>
  ); // : null;
};

export default DeviceTree;
