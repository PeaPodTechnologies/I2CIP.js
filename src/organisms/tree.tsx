'use client';

import { FC } from 'react';
import { List, ListItem, ListItemText, Paper } from '@mui/material';
import { useDevices } from '../contexts/devices';

// export type DeviceTreeProps = {
//   socket?: string;
//   // messages?: DebugJsonMessage[];
//   // setNumData?: (n: number) => void;
// };

const DeviceTree: FC = () => {
  const { devices } = useDevices();

  return devices ? (
    <Paper elevation={3} square={false} sx={{ padding: 2 }}>
      <div>Device Tree Placeholder</div>
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
        <div>No devices found</div>
      )}
    </Paper>
  ) : null;
};

export default DeviceTree;
