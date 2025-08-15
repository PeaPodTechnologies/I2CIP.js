'use client';

import { Grid, CircularProgress, Box } from '@mui/material';
import { FC, PropsWithChildren } from 'react';
import { useSocket } from '@/contexts/socket';
import DebugMessageBoard from '@/organisms/board';
import DeviceTree from '@/organisms/tree';
import Pinger from '@/organisms/ping';
import Device from '@/organisms/device';
import { useTelemetry } from '@/contexts/telemetry';
import TelemetryChart from '@/organisms/telemetrychart';
import { useDevices } from '@/contexts/devices';
import MessageDataGrid from '@/organisms/datagrid';

const Dashboard: FC<PropsWithChildren> = ({ children }) => {
  const { connected, sockets } = useSocket();
  const { devicesFlat } = useDevices();
  const { telemetry } = useTelemetry();

  return connected ? (
    <Grid
      container
      spacing={3}
      direction="row"
      sx={{
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      }}
    >
      {Object.entries(telemetry)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => (
          <Grid size={{ xs: 12, md: 4 }} key={`grid-telemetry-${key}`}>
            <TelemetryChart label={key} data={data} />
          </Grid>
        ))}
      {sockets.map((s) => (
        <Grid key={`grid-socket-${s}`} size={{ xs: 12, md: 8 }}>
          <DebugMessageBoard
            socket={s}
            enableSerialInput={s === 'microcontroller'}
          />
        </Grid>
      ))}
      <Grid size={{ xs: 12, md: 8 }}>
        <MessageDataGrid socket="microcontroller" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <DeviceTree />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Pinger />
      </Grid>
      {devicesFlat.map(([deviceId, fqa]) => (
        <Grid key={`grid-device-${deviceId}-${fqa}`} size={{ xs: 12, md: 4 }}>
          <Device deviceId={deviceId} fqa={fqa} />
        </Grid>
      ))}
    </Grid>
  ) : (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default Dashboard;
