import { Paper, Typography } from '@mui/material';
import { GridColDef, GridRowsProp, DataGrid } from '@mui/x-data-grid';
import { FC, useState } from 'react';
import { useSocket } from '../contexts/socket';

const DEBUGJSON_NUM_DATA_OPTIONS = [5, 10, 25, 50];

type MessageDataGridProps = {
  socket: string;
};

const MessageDataGrid: FC<MessageDataGridProps> = ({ socket }) => {
  const { messages } = useSocket();

  const columns: GridColDef[] = [
    { field: 'timestamp', headerName: 'Timestamp', width: 180 },
    { field: 'type', headerName: 'Type', width: 150 },
    { field: 'msg', headerName: 'Message', width: 300 },
    { field: 'data', headerName: 'Data', width: 300 },
  ];

  const rows: GridRowsProp = messages[socket]
    ?.filter((message) => message['type'] !== 'heartbeat')
    .map((message, id) => ({
      id,
      timestamp: message['timestamp'],
      type: message['type'],
      msg: message['msg'],
      data: JSON.stringify(message['data']),
    }));

  return (
    <Paper elevation={3} square={false} sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        I2CIP Messages for Socket: {socket}
      </Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: DEBUGJSON_NUM_DATA_OPTIONS[0],
            },
          },
        }}
        pageSizeOptions={DEBUGJSON_NUM_DATA_OPTIONS}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Paper>
  );
};

export default MessageDataGrid;
