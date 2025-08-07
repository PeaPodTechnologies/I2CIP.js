'use client';

import React, { FC } from 'react';
import DebugSocketProvider from '../contexts/socket';
import Dashboard from '../pages/dashboard';
import DevicesProvider from '../contexts/devices';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Home: FC = (props) => {
  return (
    <DebugSocketProvider>
      <DevicesProvider>
        <Dashboard />
      </DevicesProvider>
    </DebugSocketProvider>
  );
};

export default Home;
