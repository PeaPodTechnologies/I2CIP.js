'use client';

import { FC, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useDevices } from '../contexts/devices';
import { useSocket } from '../contexts/socket';
import { useTelemetry } from '../contexts/telemetry';
import { LineChart, ScatterChart } from '@mui/x-charts';

// export type DeviceTreeProps = {
//   socket?: string;
//   // messages?: DebugJsonMessage[];
//   // setNumData?: (n: number) => void;
// };

const TelemetryGrid: FC<{
  label: string;
  data: { x: number; y: number }[];
}> = ({ label, data }) => {
  return (
    <Grid size={{ xs: 4, md: 4 }}>
      <Paper elevation={3} square={false} sx={{ padding: 2 }}>
        <Typography variant="h6">{label}</Typography>
        {/* <ScatterChart
          height={300}
          series={[
            {
              label,
              data,
            },
          ]}
          disableVoronoi
          tooltip={{ enabled: true }}
          legend={{ enabled: true }}
        /> */}
        <LineChart
          height={300}
          xAxis={[
            {
              label: 'Time Elapsed (s)',
              data: data.map((point) => point.x / 1000),
            },
          ]}
          series={[
            {
              data: data.map((point) => point.y),
            },
          ]}
          grid={{ vertical: true, horizontal: true }}
          skipAnimation
          legend={{ enabled: true }}
        />
      </Paper>
    </Grid>
  );
};

const TelemetryGrids: FC = () => {
  const { telemetry } = useTelemetry();

  console.log(telemetry);

  return telemetry
    ? Object.entries(telemetry)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => (
          <TelemetryGrid key={key} label={key} data={data} />
        ))
    : null;
};

export default TelemetryGrids;
