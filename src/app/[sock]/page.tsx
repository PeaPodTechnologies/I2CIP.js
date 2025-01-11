import DebugMessageBoard from '@/organisms/board';
import React, { FC } from 'react';
import DebugSocketProvider from '@/contexts/socket';

export type SocketHomeProps = {
  params: Promise<{ sock: string }>;
};

const SocketHome: FC<SocketHomeProps> = async ({ params }) => {
  const sock = (await params).sock;
  return (
    <DebugSocketProvider num={10}>
      <DebugMessageBoard socket={sock} />
    </DebugSocketProvider>
  );
};

export default SocketHome;
