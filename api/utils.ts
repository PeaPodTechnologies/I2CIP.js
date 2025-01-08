import {
  DebugJsonMessageTypes,
} from './types';

export function parseType(type: DebugJsonMessageTypes): string {
  switch (type) {
    // TODO
    default:
      return '' + type;
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
