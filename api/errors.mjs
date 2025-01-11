var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/errors.ts
var ControllerTXError = class extends Error {
  static {
    __name(this, "ControllerTXError");
  }
  constructor(msg) {
    super("DEBUGJSON RX FAIL: '" + JSON.stringify(msg) + "'");
  }
};
var EnvFieldError = class extends Error {
  static {
    __name(this, "EnvFieldError");
  }
  constructor(mode, missingFields) {
    super(
      `.env file is missing the following fields necessary for ${mode} functionality: ${missingFields.join(
        ", "
      )}`
    );
  }
};
var DebugJsonSerialportError = class extends Error {
  static {
    __name(this, "DebugJsonSerialportError");
  }
  constructor(err) {
    super(`Serialport Error: ${err}`);
  }
};
export {
  ControllerTXError,
  DebugJsonSerialportError,
  EnvFieldError
};
