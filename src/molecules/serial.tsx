import { Box, Button, TextField } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { useSocket } from '@/contexts/socket';

type SerialInputProps = {
  socket?: string;
};

const SerialInput: FC<SerialInputProps> = () => {
  const [inputString, setInputString] = useState('{}');
  const [inputError, setInputError] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    try {
      JSON.parse(inputString);
      setInputError(false);
    } catch {
      setInputError(true);
    }
  }, [inputString]);

  const handleInput = () => {
    if (socket && !inputError) {
      try {
        const data = JSON.parse(inputString);
        socket.emit('serialinput', data);
        setInputString('{}'); // Reset input after sending
      } catch (error) {
        console.error('Invalid JSON input:', error);
      }
    }
  };

  return (
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
        if (!inputError && socket) {
          handleInput();
        }
      }}
    >
      <TextField
        error={inputError}
        id="serial-input"
        label="Serial Input"
        helperText="Enter JSON string to send to socket"
        value={inputString}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setInputString(event.target.value);
        }}
      />
      <Box sx={{ m: 1, marginTop: 2 }}>
        <Button
          variant="contained"
          disabled={inputError || !socket}
          onClick={handleInput}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default SerialInput;
