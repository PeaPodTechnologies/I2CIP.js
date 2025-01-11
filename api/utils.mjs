var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/utils.ts
function parseType(type) {
  switch (type) {
    case "event":
      return "Telemetry";
    // 'event' is used bi-directionally; Controller-to-Host is telemetry (i.e. component states, program flow), Host-to-Controller is for state changes (non-component/ not command, setting component-state e.g. on/off; targeted/ not config, e.g. setting up the camera lighting component-state as part of the Controller API; instead: specific and programmatic (e.g. enabling/disabling specific component-states mid-program, tuning non-component-state control parameters)
    default:
      return type.toUpperCase().charAt(0) + type.slice(1);
  }
}
__name(parseType, "parseType");
function parseDatum(value) {
  if (typeof value === "string") {
    return value;
  } else if (Array.isArray(value)) {
    return "[" + value.map(parseDatum).join() + "]";
  } else if (typeof value === "number") {
    return "" + value;
  } else if (typeof value === "boolean") {
    return value === false ? "false" : "true";
  } else if (value === null) {
    return "null";
  } else {
    return "";
  }
}
__name(parseDatum, "parseDatum");
function parseTimestamp(ms) {
  const seconds = Math.floor(ms / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const msString = (ms % 1e3).toString().padStart(3, "0");
  const secondsString = (seconds % 60).toString().padStart(2, "0");
  const minutesString = (minutes % 60).toString().padStart(2, "0");
  const hoursString = hours.toString().padStart(2, "0");
  return `${hoursString}:${minutesString}:${secondsString}.${msString}`;
}
__name(parseTimestamp, "parseTimestamp");
export {
  parseDatum,
  parseTimestamp,
  parseType
};
