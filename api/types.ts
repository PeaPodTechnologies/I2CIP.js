export type DebugJsonMessageTypes =
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'telemetry'
  | 'command'
  | 'config'
  | 'revision';

export type DebugJsonMessage = {
  type: DebugJsonMessageTypes; // * Required; Usually first in a stream
  t?: string; // Additional message typing i.e. device IDs, "WARN", "BSOD", etc.
  timestamp?: number; // ** Suggested; Milliseconds since t=revision sent (or program start)
  msg?: string;
  data?: {
    [key: string]: boolean | number | number[] | string; // I.e. {"temperature": 25.0, "button0": true, "nav": "~/mydir/"}
    // We'll handle floating-point precision at deserialization time, create a class DebugJsonNumber
  };
  units?: {
    [key: string]: string; // I.e. "temperature": "°C"
  };
};
