'use client';

import DebugMessageBoard from '../organisms/board';
import React, { FC } from 'react';
import DebugSocketProvider from '@/contexts/socket';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Home: FC = (props) => {
  return (
    <DebugSocketProvider>
      <DebugMessageBoard num={10} />
    </DebugSocketProvider>
  );
};

export default Home;
