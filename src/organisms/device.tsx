import { FC, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  IconButton,
  Paper,
  Snackbar,
  SnackbarCloseReason,
  TextField,
  Typography,
} from '@mui/material';
import { useSocket } from '@/contexts/socket';
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
import { Close } from '@mui/icons-material';

const Device: FC<{ deviceId: DeviceID; fqa: number }> = ({ deviceId, fqa }) => {
  const { socket } = useSocket();
  const [argsA, setArgsA] = useState<string>('');
  const [argsS, setArgsS] = useState<string>('');
  const [argsB, setArgsB] = useState<string>('');

  const [interval, _setInterval] = useState<number>(0);
  const [isInterval, setIsInterval] = useState<boolean>(false);

  const [snackbar, setSnackbar] = useState<boolean>(false);
  const [errorSnackbar, setErrorSnackbar] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const closeSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setSnackbar(false);
  };

  const closeErrorSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setErrorSnackbar(false);
  };

  const handleResponse = ({ error }) => {
    if (error) {
      setErrorMessage(error);
      setErrorSnackbar(true);
    } else {
      setSnackbar(true);
    }
  };

  const handleSet = () => {
    const instruction = {
      type: 'command',
      data: {
        fqa,
        s: DEVICE_ARG_PARSE_S[deviceId](argsS) || undefined,
        b: DEVICE_ARG_PARSE_B[deviceId](argsB) || undefined,
      },
    };
    if (isInterval && interval > 0.1) {
      socket.emit(
        'scheduler-post',
        {
          interval: interval * 1000,
          instruction,
        },
        handleResponse
      );
    } else {
      socket.emit('serialinput', instruction, handleResponse);
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
    if (isInterval && interval > 0.1) {
      socket.emit(
        'scheduler-post',
        {
          interval: interval * 1000,
          instruction,
        },
        handleResponse
      );
    } else {
      socket.emit('serialinput', instruction, handleResponse);
    }
  };

  return (
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
      <Snackbar open={snackbar} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert
          onClose={closeSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Serial input received successfully!
        </Alert>
      </Snackbar>
      <Snackbar
        open={errorSnackbar}
        autoHideDuration={6000}
        onClose={closeErrorSnackbar}
      >
        <Alert
          onClose={closeErrorSnackbar}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage || 'An error occurred while sending serial input.'}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Device;
