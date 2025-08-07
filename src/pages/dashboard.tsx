'use client';

import { Grid, CircularProgress } from '@mui/material';
import { FC, PropsWithChildren } from 'react';
import { useSocket } from '../contexts/socket';
import DebugMessageBoard from '../organisms/board';
import DeviceTree from '../organisms/tree';
import Pinger from '../organisms/ping';

const Dashboard: FC<PropsWithChildren> = ({ children }) => {
  const { connected, sockets } = useSocket();

  console.log(connected);
  console.log(sockets);

  return connected && sockets.length > 0 ? (
    <Grid
      container
      spacing={2}
      direction="row"
      sx={{
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      }}
    >
      {sockets.map((s) => (
        <Grid key={`grid-${s}`} size={{ xs: 6, md: 8 }}>
          <DebugMessageBoard
            key={`board-${s}`}
            socket={s}
            enableSerialInput={s === 'microcontroller'}
          />
        </Grid>
      ))}
      <Grid size={{ xs: 4, md: 4 }}>
        <DeviceTree />
      </Grid>
      <Grid size={{ xs: 4, md: 4 }}>
        <Pinger />
      </Grid>
    </Grid>
  ) : (
    <CircularProgress />
  );
};

export default Dashboard;
