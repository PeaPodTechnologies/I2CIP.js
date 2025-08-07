import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { useSocket } from './socket';

type DeviceTree = {
  [key: string]: number[];
}[];

type DevicesContextType = {
  devices: DeviceTree | null;
};

const DevicesContext = createContext<DevicesContextType>({
  devices: null,
});

const DevicesProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<DeviceTree | null>(null);

  const { messages } = useSocket();

  const tree = messages['microcontroller']
    ? messages['microcontroller'].find((msg) => msg['type'] == 'tree')
    : null;

  useEffect(() => {
    if (messages && tree) {
      setDevices(tree['data'] as DeviceTree);
    }
  }, [tree, messages]);

  return (
    <DevicesContext.Provider value={{ devices }}>
      {children}
    </DevicesContext.Provider>
  );
};

export const useDevices = () => {
  const context = useContext(DevicesContext);
  if (!context) {
    throw new Error('useDevices must be used within a DevicesProvider');
  }
  return context;
};

export default DevicesProvider;
