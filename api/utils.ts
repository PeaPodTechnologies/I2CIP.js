import {
  DebugJsonMessageTypes,
} from './types';

export function parseType(type: DebugJsonMessageTypes): string {
  switch (type) {
    case 'event':
      return 'Telemetry'; // 'event' is used bi-directionally; Controller-to-Host is telemetry (i.e. component states, program flow), Host-to-Controller is for state changes (non-component/ not command, setting component-state e.g. on/off; targeted/ not config, e.g. setting up the camera lighting component-state as part of the Controller API; instead: specific and programmatic (e.g. enabling/disabling specific component-states mid-program, tuning non-component-state control parameters)
    default:
      return type.toUpperCase().charAt(0) + type.slice(1);
  }
}

// JSON-friendly always
export function parseDatum(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  } else if (Array.isArray(value)) {
    return '[' + value.map(parseDatum).join() + ']'; // Recurse
  } else if (typeof value === 'number') {
    return '' + value; // Let JS handle it
  } else if (typeof value === 'boolean') {
    return value === false ? 'false' : 'true';
  } else if (value === null) {
    return 'null';
  } else {
    return '';
  }
}

export function parseTimestamp(ms: number): string {
  // ms duration since program start
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const msString = (ms % 1000).toString().padStart(3, '0');
  const secondsString = (seconds % 60).toString().padStart(2, '0');
  const minutesString = (minutes % 60).toString().padStart(2, '0');
  const hoursString = hours.toString().padStart(2, '0');

  return `${hoursString}:${minutesString}:${secondsString}.${msString}`;
};