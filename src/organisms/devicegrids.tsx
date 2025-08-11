import { FC, useState } from 'react';
import { useDevices } from '../contexts/devices';
import {
  Box,
  Button,
  Checkbox,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useSocket } from '../contexts/socket';
import { fqaToString } from '../utils';
import {
  DEVICE_ARG_HAS,
  DEVICE_ARG_PARSE_A,
  DEVICE_ARG_PARSE_B,
  DEVICE_ARG_PARSE_S,
  DEVICE_ARG_TYPES_GET,
  DEVICE_ARG_TYPES_SET,
  DeviceID,
} from '../devicetypes';

const DeviceGrid: FC<{ device: { [key in DeviceID]: number } }> = ({
  device,
}) => {
  const { socket } = useSocket();
  const [argsA, setArgsA] = useState<string>('');
  const [argsS, setArgsS] = useState<string>('');
  const [argsB, setArgsB] = useState<string>('');

  const [interval, _setInterval] = useState<number>(0);
  const [isInterval, setIsInterval] = useState<boolean>(false);

  const deviceId = Object.keys(device)[0] as DeviceID;
  const fqa = Object.values(device)[0];

  const handleSet = () => {
    const instruction = {
      type: 'command',
      data: {
        fqa,
        s: DEVICE_ARG_PARSE_S[deviceId](argsS) || undefined,
        b: DEVICE_ARG_PARSE_B[deviceId](argsB) || undefined,
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

  const handleGet = () => {
    console.log(`Scheduler: ${isInterval}, Interval: ${interval}`);
    const instruction = {
      type: 'command',
      data: {
        fqa,
        g: true,
        a: DEVICE_ARG_PARSE_A[deviceId](argsA) || undefined,
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
    <Grid key={`grid-${deviceId}-${fqa}`} size={{ xs: 4, md: 4 }}>
      <Paper elevation={3} square={false} sx={{ padding: 2 }}>
        <div>{deviceId}</div>
        <div>{fqaToString(fqa)}</div>
        {DEVICE_ARG_HAS[deviceId].b ? (
          <Box
            component="form"
            sx={{
              display: 'flex',
              // alignItems: 'center',
              '& .MuiTextField-root': { m: 1, width: '25ch' },
            }}
            noValidate
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault(); // Prevents page refresh
            }}
          >
            <TextField
              error={!DEVICE_ARG_TYPES_SET[deviceId](argsS, argsB)}
              label="Set Argument"
              value={argsB}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setArgsB(event.target.value);
              }}
            />
          </Box>
        ) : null}
        {DEVICE_ARG_HAS[deviceId].s ? (
          <Box
            component="form"
            sx={{
              display: 'flex',
              // alignItems: 'center',
              '& .MuiTextField-root': { m: 1, width: '25ch' },
            }}
            noValidate
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault(); // Prevents page refresh
            }}
          >
            <TextField
              error={!DEVICE_ARG_TYPES_SET[deviceId](argsS, argsB)}
              label="Set Value"
              value={argsS}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setArgsS(event.target.value);
              }}
            />
          </Box>
        ) : null}
        {DEVICE_ARG_HAS[deviceId].s ? (
          <Button
            variant="contained"
            disabled={
              !DEVICE_ARG_HAS[deviceId].s ||
              !DEVICE_ARG_TYPES_SET[deviceId](argsS, argsB) ||
              !socket ||
              (isInterval && interval <= 0)
            }
            onClick={handleSet}
          >
            Set
          </Button>
        ) : null}
        {DEVICE_ARG_HAS[deviceId].a ? (
          <Box
            component="form"
            sx={{
              display: 'flex',
              // alignItems: 'center',
              '& .MuiTextField-root': { m: 1, width: '25ch' },
            }}
            noValidate
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault(); // Prevents page refresh
            }}
          >
            <TextField
              error={!DEVICE_ARG_TYPES_GET[deviceId](argsA)}
              label="Get Argument"
              value={argsA}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setArgsA(event.target.value);
              }}
            />
          </Box>
        ) : null}
        {DEVICE_ARG_HAS[deviceId].g ? (
          <Button
            variant="contained"
            disabled={
              !DEVICE_ARG_HAS[deviceId].g ||
              !DEVICE_ARG_TYPES_GET[deviceId](argsA) ||
              !socket ||
              (isInterval && interval <= 0)
            }
            onClick={handleGet}
          >
            Get
          </Button>
        ) : null}
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
        </Box>
      </Paper>
    </Grid>
  );
};

const DeviceGrids: FC = () => {
  const { devices } = useDevices();

  const devicesFlat = devices
    ? devices.reduce(
        (flat, m) => {
          Object.entries(m).forEach(([id, fqas]) => {
            fqas.forEach((fqa) => {
              flat.push({
                [id]: fqa,
              });
            });
          });
          return flat;
        },
        [] as { [key: string]: number }[]
      )
    : [];

  return Array.isArray(devices) && devices.length > 0
    ? devicesFlat.map((device) =>
        DEVICE_ARG_HAS[Object.keys(device)[0]] ? (
          <DeviceGrid
            key={`device-grid-${Object.keys(device)[0]}`}
            device={device}
          />
        ) : null
      )
    : null;
};

export default DeviceGrids;
