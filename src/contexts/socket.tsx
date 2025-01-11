'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
  FC,
} from 'react';
import { io, Socket } from 'socket.io-client';

export type SocketContextType = {
  connected: boolean;
  socket: Socket | null;
  sockets?: string[]; // List of connected sockets
  messages: { [key: string]: object[] };
  // clearMessages?: (label: string) => void;
};

const SocketContext = createContext<SocketContextType>({
  connected: false,
  socket: null,
  sockets: undefined,
  messages: {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a DebugSocketProvider');
  }
  return context;
};

export type DebugSocketProviderProps = PropsWithChildren<{
  hostname?: string;
  num?: number;
}>;

const _socket = io();

const DebugSocketProvider: FC<DebugSocketProviderProps> = ({
  children,
  hostname,
  num,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [sockets, setSockets] = useState<{ [key: string]: boolean }>({});
  // const [_socket] = useState(hostname ? io(hostname) : io());
  const [socket, _setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<{ [key: string]: object[] }>({});

  // const clearMessages = (label: string) => {
  //   setMessages((prev) => {
  //     const updatedMessages = { ...prev, [label]: [] };
  //     return updatedMessages;
  //   });
  // };

  useEffect(() => {
    const addSocket = (sock: string): boolean => {
      let r = false;
      setSockets((prev) => {
        r = prev[sock] ?? false;
        const updatedSockets = { ...prev, [sock]: true };
        return updatedSockets;
      });
      return r;
    };

    const addMessage = (label: string, msg: object) => {
      setMessages((prev) => {
        const updatedMessages = {
          ...prev,
          [label]: [msg, ...(prev[label] ?? [])].slice(0, num ?? 1),
        };
        return updatedMessages;
      });
    };

    function onJson(socketMsg: object & { _socket: string }) {
      if (!addSocket(socketMsg._socket)) {
        socket?.on(socketMsg._socket, (m) => {
          console.log(m);
          addMessage(socketMsg._socket, { ...m, _socket: undefined });
        });
      }
    }

    function onDisconnect(rsn: string) {
      console.log(`Socket Disconnected: ${rsn}`);
      setIsConnected(false);
      socket?.off('json', onJson);
    }

    function onConnect() {
      console.log(`Socket Connected: ${_socket.id}`);
      setIsConnected(true);
      _socket.off('connect', onConnect);
      _socket.on('disconnect', onDisconnect);
      socket?.on('json', onJson);
    }
    if (_socket.connected) {
      onConnect();
    } else {
      _socket.on('connect', onConnect);
    }

    if (socket === null) _setSocket(_socket); // First-time; will trigger a re-render

    return () => {
      // _socket.off('connect', onConnect);
      _socket.off('disconnect', onDisconnect);
      socket?.off('json', onJson);
    };
  }, [hostname, isConnected, socket, num]);

  const listSockets = (): string[] =>
    Object.entries(sockets).reduce((arr, s) => {
      if (s[1]) {
        arr.push(s[0]);
      }
      return arr;
    }, [] as string[]);

  return (
    <SocketContext.Provider
      value={{
        connected: isConnected,
        socket,
        sockets: isConnected ? listSockets() : undefined,
        messages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default DebugSocketProvider;
