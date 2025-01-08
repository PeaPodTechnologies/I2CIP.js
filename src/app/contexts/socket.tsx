import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from 'react';
import { DebugJsonMessage } from '../../../api/types';
import { io, Socket } from 'socket.io-client';

export const socket: Socket = io();

export type SocketContextType = {
  connected: boolean;
  sockets?: string[]; // List of connected sockets
};

const SocketContext = createContext<SocketContextType>({ connected: false });

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a DebugSocketProvider');
  }
  return context;
};

export type DebugSocketProviderProps = PropsWithChildren<{
  socketChildMap?: (socket: string) => React.ReactNode;
}>;

const DebugSocketProvider: React.FC<DebugSocketProviderProps> = ({
  socketChildMap,
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [sockets, setSockets] = useState<{ [key: string]: boolean }>({});

  const addSocket = (sock: string) => {
    setSockets((prev) => {
      const updatedSockets = { ...prev, [sock]: true };
      return updatedSockets;
    });
  };

  useEffect(() => {
    function onDisconnect(rsn: string) {
      console.log(`Disconnected: ${rsn}`);
      setIsConnected(false);
    }

    function onConnect() {
      console.log(`Connected: ${socket.id}`);
      setIsConnected(true);
      socket.on('disconnect', onDisconnect);
      socket.on('json', onJson);
    }

    function onJson(socketMsg: { _socket: string }) {
      addSocket(socketMsg._socket);
    }

    socket.on('connect', onConnect);

    if (socket.connected) {
      onConnect();
    } else {
      setSockets({});
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('json', onJson);
    };
  }, [socket.connected]);

  useEffect(() => {
    console.log(`Sockets: ${JSON.stringify(sockets)}`);
  }, [sockets]);

  return (
    <SocketContext.Provider
      value={{
        connected: isConnected,
        sockets:
          Object.keys(sockets).length === 0 || !isConnected
            ? undefined
            : (Object.entries(sockets).reduce((arr, s) => {
                if (s[1]) arr.push(s[0]);
                return arr;
              }) as string[]),
      }}
    >
      {socketChildMap === undefined || Object.keys(sockets).length === 0
        ? children
        : Object.entries(sockets).map((sock) => {
            // console.log(`Socket Child Map: ${sock[0]}`);
            if (sock[1]) return socketChildMap(sock[0]);
          })}
    </SocketContext.Provider>
  );
};

export default DebugSocketProvider;
