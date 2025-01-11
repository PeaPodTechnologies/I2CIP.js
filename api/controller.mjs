var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/controller.ts
import chalk from "chalk";

// lib/serialport/packages/parser-delimiter/lib/index.ts
import { Transform } from "stream";
var DelimiterParser = class extends Transform {
  static {
    __name(this, "DelimiterParser");
  }
  includeDelimiter;
  delimiter;
  buffer;
  constructor({ delimiter, includeDelimiter = false, ...options }) {
    super(options);
    if (delimiter === void 0) {
      throw new TypeError('"delimiter" is not a bufferable object');
    }
    if (delimiter.length === 0) {
      throw new TypeError('"delimiter" has a 0 or undefined length');
    }
    this.includeDelimiter = includeDelimiter;
    this.delimiter = Buffer.from(delimiter);
    this.buffer = Buffer.alloc(0);
  }
  _transform(chunk, encoding, cb) {
    let data = Buffer.concat([this.buffer, chunk]);
    let position;
    while ((position = data.indexOf(this.delimiter)) !== -1) {
      this.push(data.slice(0, position + (this.includeDelimiter ? this.delimiter.length : 0)));
      data = data.slice(position + this.delimiter.length);
    }
    this.buffer = data;
    cb();
  }
  _flush(cb) {
    this.push(this.buffer);
    this.buffer = Buffer.alloc(0);
    cb();
  }
};

// lib/serialport/packages/parser-readline/lib/index.ts
var ReadlineParser = class extends DelimiterParser {
  static {
    __name(this, "ReadlineParser");
  }
  constructor(options) {
    const opts = {
      delimiter: Buffer.from("\n", "utf8"),
      encoding: "utf8",
      ...options
    };
    if (typeof opts.delimiter === "string") {
      opts.delimiter = Buffer.from(opts.delimiter, opts.encoding);
    }
    super(opts);
  }
};

// lib/serialport/packages/stream/lib/index.ts
import { Duplex } from "stream";
import debugFactory from "debug";
var debug = debugFactory("serialport/stream");
var DisconnectedError = class extends Error {
  static {
    __name(this, "DisconnectedError");
  }
  disconnected;
  constructor(message) {
    super(message);
    this.disconnected = true;
  }
};
var defaultSetFlags = {
  brk: false,
  cts: false,
  dtr: true,
  rts: true
};
function allocNewReadPool(poolSize) {
  const pool = Buffer.allocUnsafe(poolSize);
  pool.used = 0;
  return pool;
}
__name(allocNewReadPool, "allocNewReadPool");
var SerialPortStream = class extends Duplex {
  static {
    __name(this, "SerialPortStream");
  }
  port;
  _pool;
  _kMinPoolSpace;
  opening;
  closing;
  settings;
  /**
   * Create a new serial port object for the `path`. In the case of invalid arguments or invalid options, when constructing a new SerialPort it will throw an error. The port will open automatically by default, which is the equivalent of calling `port.open(openCallback)` in the next tick. You can disable this by setting the option `autoOpen` to `false`.
   * @emits open
   * @emits data
   * @emits close
   * @emits error
   */
  constructor(options, openCallback) {
    const settings = {
      autoOpen: true,
      endOnClose: false,
      highWaterMark: 64 * 1024,
      ...options
    };
    super({
      highWaterMark: settings.highWaterMark
    });
    if (!settings.binding) {
      throw new TypeError('"Bindings" is invalid pass it as `options.binding`');
    }
    if (!settings.path) {
      throw new TypeError(`"path" is not defined: ${settings.path}`);
    }
    if (typeof settings.baudRate !== "number") {
      throw new TypeError(`"baudRate" must be a number: ${settings.baudRate}`);
    }
    this.settings = settings;
    this.opening = false;
    this.closing = false;
    this._pool = allocNewReadPool(this.settings.highWaterMark);
    this._kMinPoolSpace = 128;
    if (this.settings.autoOpen) {
      this.open(openCallback);
    }
  }
  get path() {
    return this.settings.path;
  }
  get baudRate() {
    return this.settings.baudRate;
  }
  get isOpen() {
    return (this.port?.isOpen ?? false) && !this.closing;
  }
  _error(error, callback) {
    if (callback) {
      callback.call(this, error);
    } else {
      this.emit("error", error);
    }
  }
  _asyncError(error, callback) {
    process.nextTick(() => this._error(error, callback));
  }
  /**
   * Opens a connection to the given serial port.
   * @param {ErrorCallback=} openCallback - Called after a connection is opened. If this is not provided and an error occurs, it will be emitted on the port's `error` event.
   * @emits open
   */
  open(openCallback) {
    if (this.isOpen) {
      return this._asyncError(new Error("Port is already open"), openCallback);
    }
    if (this.opening) {
      return this._asyncError(new Error("Port is opening"), openCallback);
    }
    const { highWaterMark, binding, autoOpen, endOnClose, ...openOptions } = this.settings;
    this.opening = true;
    debug("opening", `path: ${this.path}`);
    this.settings.binding.open(openOptions).then(
      (port) => {
        debug("opened", `path: ${this.path}`);
        this.port = port;
        this.opening = false;
        this.emit("open");
        if (openCallback) {
          openCallback.call(this, null);
        }
      },
      (err) => {
        this.opening = false;
        debug("Binding #open had an error", err);
        this._error(err, openCallback);
      }
    );
  }
  /**
   * Changes the baud rate for an open port. Emits an error or calls the callback if the baud rate isn't supported.
   * @param {object=} options Only supports `baudRate`.
   * @param {number=} [options.baudRate] The baud rate of the port to be opened. This should match one of the commonly available baud rates, such as 110, 300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, or 115200. Custom rates are supported best effort per platform. The device connected to the serial port is not guaranteed to support the requested baud rate, even if the port itself supports that baud rate.
   * @param {ErrorCallback=} [callback] Called once the port's baud rate changes. If `.update` is called without a callback, and there is an error, an error event is emitted.
   * @returns {undefined}
   */
  update(options, callback) {
    if (!this.isOpen || !this.port) {
      debug("update attempted, but port is not open");
      return this._asyncError(new Error("Port is not open"), callback);
    }
    debug("update", `baudRate: ${options.baudRate}`);
    this.port.update(options).then(
      () => {
        debug("binding.update", "finished");
        this.settings.baudRate = options.baudRate;
        if (callback) {
          callback.call(this, null);
        }
      },
      (err) => {
        debug("binding.update", "error", err);
        return this._error(err, callback);
      }
    );
  }
  write(data, encoding, callback) {
    if (Array.isArray(data)) {
      data = Buffer.from(data);
    }
    if (typeof encoding === "function") {
      return super.write(data, encoding);
    }
    return super.write(data, encoding, callback);
  }
  _write(data, encoding, callback) {
    if (!this.isOpen || !this.port) {
      this.once("open", () => {
        this._write(data, encoding, callback);
      });
      return;
    }
    debug("_write", `${data.length} bytes of data`);
    this.port.write(data).then(
      () => {
        debug("binding.write", "write finished");
        callback(null);
      },
      (err) => {
        debug("binding.write", "error", err);
        if (!err.canceled) {
          this._disconnected(err);
        }
        callback(err);
      }
    );
  }
  _writev(data, callback) {
    debug("_writev", `${data.length} chunks of data`);
    const dataV = data.map((write) => write.chunk);
    this._write(Buffer.concat(dataV), "binary", callback);
  }
  _read(bytesToRead) {
    if (!this.isOpen || !this.port) {
      debug("_read", "queueing _read for after open");
      this.once("open", () => {
        this._read(bytesToRead);
      });
      return;
    }
    if (!this._pool || this._pool.length - this._pool.used < this._kMinPoolSpace) {
      debug("_read", "discarding the read buffer pool because it is below kMinPoolSpace");
      this._pool = allocNewReadPool(this.settings.highWaterMark);
    }
    const pool = this._pool;
    const toRead = Math.min(pool.length - pool.used, bytesToRead);
    const start = pool.used;
    debug("_read", "reading", { start, toRead });
    this.port.read(pool, start, toRead).then(
      ({ bytesRead }) => {
        debug("binding.read", "finished", { bytesRead });
        if (bytesRead === 0) {
          debug("binding.read", "Zero bytes read closing readable stream");
          this.push(null);
          return;
        }
        pool.used += bytesRead;
        this.push(pool.slice(start, start + bytesRead));
      },
      (err) => {
        debug("binding.read", "error", err);
        if (!err.canceled) {
          this._disconnected(err);
        }
        this._read(bytesToRead);
      }
    );
  }
  _disconnected(err) {
    if (!this.isOpen) {
      debug("disconnected aborted because already closed", err);
      return;
    }
    debug("disconnected", err);
    this.close(void 0, new DisconnectedError(err.message));
  }
  /**
   * Closes an open connection.
   *
   * If there are in progress writes when the port is closed the writes will error.
   * @param {ErrorCallback} callback Called once a connection is closed.
   * @param {Error} disconnectError used internally to propagate a disconnect error
   */
  close(callback, disconnectError = null) {
    if (!this.isOpen || !this.port) {
      debug("close attempted, but port is not open");
      return this._asyncError(new Error("Port is not open"), callback);
    }
    this.closing = true;
    debug("#close");
    this.port.close().then(
      () => {
        this.closing = false;
        debug("binding.close", "finished");
        this.emit("close", disconnectError);
        if (this.settings.endOnClose) {
          this.emit("end");
        }
        if (callback) {
          callback.call(this, disconnectError);
        }
      },
      (err) => {
        this.closing = false;
        debug("binding.close", "had an error", err);
        return this._error(err, callback);
      }
    );
  }
  /**
   * Set control flags on an open port. Uses [`SetCommMask`](https://msdn.microsoft.com/en-us/library/windows/desktop/aa363257(v=vs.85).aspx) for Windows and [`ioctl`](http://linux.die.net/man/4/tty_ioctl) for OS X and Linux.
   *
   * All options are operating system default when the port is opened. Every flag is set on each call to the provided or default values. If options isn't provided default options is used.
   */
  set(options, callback) {
    if (!this.isOpen || !this.port) {
      debug("set attempted, but port is not open");
      return this._asyncError(new Error("Port is not open"), callback);
    }
    const settings = { ...defaultSetFlags, ...options };
    debug("#set", settings);
    this.port.set(settings).then(
      () => {
        debug("binding.set", "finished");
        if (callback) {
          callback.call(this, null);
        }
      },
      (err) => {
        debug("binding.set", "had an error", err);
        return this._error(err, callback);
      }
    );
  }
  /**
   * Returns the control flags (CTS, DSR, DCD) on the open port.
   * Uses [`GetCommModemStatus`](https://msdn.microsoft.com/en-us/library/windows/desktop/aa363258(v=vs.85).aspx) for Windows and [`ioctl`](http://linux.die.net/man/4/tty_ioctl) for mac and linux.
   */
  get(callback) {
    if (!this.isOpen || !this.port) {
      debug("get attempted, but port is not open");
      return this._asyncError(new Error("Port is not open"), callback);
    }
    debug("#get");
    this.port.get().then(
      (status) => {
        debug("binding.get", "finished");
        callback.call(this, null, status);
      },
      (err) => {
        debug("binding.get", "had an error", err);
        return this._error(err, callback);
      }
    );
  }
  /**
   * Flush discards data received but not read, and written but not transmitted by the operating system. For more technical details, see [`tcflush(fd, TCIOFLUSH)`](http://linux.die.net/man/3/tcflush) for Mac/Linux and [`FlushFileBuffers`](http://msdn.microsoft.com/en-us/library/windows/desktop/aa364439) for Windows.
   */
  flush(callback) {
    if (!this.isOpen || !this.port) {
      debug("flush attempted, but port is not open");
      return this._asyncError(new Error("Port is not open"), callback);
    }
    debug("#flush");
    this.port.flush().then(
      () => {
        debug("binding.flush", "finished");
        if (callback) {
          callback.call(this, null);
        }
      },
      (err) => {
        debug("binding.flush", "had an error", err);
        return this._error(err, callback);
      }
    );
  }
  /**
     * Waits until all output data is transmitted to the serial port. After any pending write has completed it calls [`tcdrain()`](http://linux.die.net/man/3/tcdrain) or [FlushFileBuffers()](https://msdn.microsoft.com/en-us/library/windows/desktop/aa364439(v=vs.85).aspx) to ensure it has been written to the device.
    * @example
    Write the `data` and wait until it has finished transmitting to the target serial port before calling the callback. This will queue until the port is open and writes are finished.
  
    ```js
    function writeAndDrain (data, callback) {
      port.write(data);
      port.drain(callback);
    }
    ```
    */
  drain(callback) {
    debug("drain");
    if (!this.isOpen || !this.port) {
      debug("drain queuing on port open");
      this.once("open", () => {
        this.drain(callback);
      });
      return;
    }
    this.port.drain().then(
      () => {
        debug("binding.drain", "finished");
        if (callback) {
          callback.call(this, null);
        }
      },
      (err) => {
        debug("binding.drain", "had an error", err);
        return this._error(err, callback);
      }
    );
  }
};

// lib/serialport/packages/serialport/lib/serialport-mock.ts
import { MockBinding } from "@serialport/binding-mock";
var SerialPortMock = class extends SerialPortStream {
  static {
    __name(this, "SerialPortMock");
  }
  static list = MockBinding.list;
  static binding = MockBinding;
  constructor(options, openCallback) {
    const opts = {
      binding: MockBinding,
      ...options
    };
    super(opts, openCallback);
  }
};

// lib/serialport/packages/serialport/lib/serialport.ts
import { autoDetect } from "@serialport/bindings-cpp";
var DetectedBinding = autoDetect();
var SerialPort = class extends SerialPortStream {
  static {
    __name(this, "SerialPort");
  }
  static list = DetectedBinding.list;
  static binding = DetectedBinding;
  constructor(options, openCallback) {
    const opts = {
      binding: DetectedBinding,
      ...options
    };
    super(opts, openCallback);
  }
};

// api/errors.ts
var ControllerTXError = class extends Error {
  static {
    __name(this, "ControllerTXError");
  }
  constructor(msg) {
    super("DEBUGJSON RX FAIL: '" + JSON.stringify(msg) + "'");
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

// api/ui.ts
import ora from "ora";
var DEBUGJSON_DEFAULT_SPINNER = {
  interval: 50,
  frames: [
    "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
    "\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
    "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
    "\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
    "\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
    "\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
    "\u2581\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
    "\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581",
    "\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
    "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
    "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2581",
    "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
    "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
    "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
    "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
    "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588"
  ]
};
var DebugJsonUI = class {
  static {
    __name(this, "DebugJsonUI");
  }
  spinner = this.reset();
  _log;
  _err;
  constructor(con = console) {
    this._log = con.log;
    this._err = con.error;
  }
  reset() {
    if (this.spinning()) {
      this.spinner.stop();
    } else {
      this.spinner = ora({
        // stream: this, 
        spinner: DEBUGJSON_DEFAULT_SPINNER
      });
    }
    return this.spinner;
  }
  spinning() {
    return this.spinner?.isSpinning;
  }
  /**
   * Start the loading spinner.
   * @param text Text to display.
   * @param spinner Spinner to use. Defaults to the default spinner.
   */
  start(text = "") {
    if (this.spinning()) {
      this.spinner.text = text;
    } else {
      this.reset();
      this.spinner.start(text);
    }
  }
  /**
   * Fail the loading spinner.
   * @param text Text to display.
   */
  fail(text = "") {
    if (!this.spinning()) {
      this.reset();
    }
    this.spinner.fail(text);
  }
  /**
   * Succeed the loading spinner.
   * @param text Text to display.
   */
  succeed(text = "") {
    if (!this.spinning()) {
      this.reset();
    }
    this.spinner.succeed(text);
  }
  /**
   * Complete the loading spinner with info (blue `i`)
   * @param text Text to display.
   */
  info(text = "") {
    if (!this.spinning()) {
      this.reset();
    }
    this.spinner.info(text);
  }
  /**
   * If spinning: stop and clear the current spinner, log some text, then restart the spinner
   * Else: Just log
   *
   * @param text Text to log
   */
  log(args) {
    if (this.spinning()) {
      let oldtext = this.spinner.text;
      this.spinner.stop();
      this._log(args);
      this.spinner.start(oldtext);
    } else {
      this._log(args);
    }
  }
  /**
   * If spinning: stop and clear the current spinner, log some text, then restart the spinner
   * Else: Just log
   *
   * @param text Text to log
   */
  err(args) {
    if (this.spinning()) {
      let oldtext = this.spinner.text;
      this.spinner.stop();
      this._err(args);
      this.spinner.start(oldtext);
    } else {
      this._err(args);
    }
  }
};
var DebugJsonConsole = new DebugJsonUI();

// api/controller.ts
var BAUDRATE = 115200;
var CONTROLLER_REVISION = 0;
var SERIAL_TIMEOUT_SECONDS = 0.5;
function findSerialPort(path) {
  return SerialPort.list().then((ports) => {
    return ports.reduce((acc, port) => {
      console.log(JSON.stringify(port, null, 2));
      if (port && port["path"] && port["path"].toLowerCase().includes(path.toLowerCase())) {
        acc.push(port.path);
      }
      return acc;
    }, []);
  });
}
__name(findSerialPort, "findSerialPort");
var MicroController = class {
  // private resetpin: Gpio;
  constructor(serialport, passRevision = true) {
    this.serialport = serialport;
    this.passRevision = passRevision;
    this.serial = new SerialPort({
      path: serialport,
      baudRate: BAUDRATE,
      autoOpen: false
    });
    this.serial.on("error", async (err) => {
      throw new DebugJsonSerialportError(`${err.name} - ${err.message}`);
    });
    this.parser = this.serial.pipe(
      new ReadlineParser({
        delimiter: "\n",
        includeDelimiter: false
      })
    );
  }
  static {
    __name(this, "MicroController");
  }
  serial;
  parser;
  #timedout = false;
  timeout;
  // Starts serial (newline parser) and resolves when RX revision is correct
  start(onMessage) {
    this.pauseTimeout(true);
    this.parser.removeAllListeners("data");
    return new Promise(async (res, rej) => {
      this.reset().catch((err) => rej(err)).then(() => {
        this.resetTimeout(rej);
        DebugJsonConsole.start("CONTROLLER REVISION...");
      });
      this.parser.on("error", async (_err) => {
        await this.reset().catch(() => rej(new DebugJsonSerialportError(`${_err.name} - ${_err.message}`)));
      });
      this.parser.on("data", async (msgtxt) => {
        this.resetTimeout(rej);
        let msg;
        try {
          msg = JSON.parse(msgtxt);
        } catch (err) {
          rej(err);
          return;
        }
        switch (msg.type) {
          case "revision":
            if (msg.data?.revision === CONTROLLER_REVISION) {
              if (DebugJsonConsole.spinning()) {
                DebugJsonConsole.succeed(
                  `CONTROLLER REVISION PASS! ${msg.data.revision}`
                );
              }
              res();
            } else {
              DebugJsonConsole.fail(
                `CONTROLLER REVISION FAIL: ${msg.data?.revision ?? "NULL"} != ${CONTROLLER_REVISION}`
              );
              this.stop();
            }
            if (this.passRevision === false) {
              break;
            }
            onMessage(msg);
            break;
          default:
            onMessage(msg);
            break;
        }
      });
    });
  }
  /**
   * Clear the serial timeout.
   */
  pauseTimeout(force = false) {
    if (this.timeout && (this.#timedout || force)) {
      clearTimeout(this.timeout);
    }
  }
  /**
   * Refresh (or start) the serial timeout.
   */
  resetTimeout(cb, timeoutSeconds = SERIAL_TIMEOUT_SECONDS) {
    this.pauseTimeout(true);
    this.timeout = setTimeout(() => {
      DebugJsonConsole.fail(
        `CONTROLLER TIMEOUT: ${timeoutSeconds}s`
      );
      this.#timedout = true;
      this.reset().catch((err) => {
        if (cb) {
          cb(err);
        }
      });
    }, timeoutSeconds * 1e3);
  }
  write(msg) {
    DebugJsonConsole.info(`[${chalk.yellow("WRITE")}] - ${JSON.stringify(msg)}`);
    this.serial.write(JSON.stringify(msg) + "\n", void 0, (err) => {
      if (err) throw new ControllerTXError(JSON.stringify(msg));
    });
  }
  stop() {
    this.pauseTimeout();
    if (this.serial.isOpen) this.serial.close();
  }
  /**
   * Resets the microcontroller by closing and re-opening serial.
   */
  reset() {
    this.stop();
    return new Promise((reso, reje) => {
      DebugJsonConsole.start("CONTROLLER...");
      this.serial.open((err) => {
        if (err) {
          reje(err);
        } else {
          DebugJsonConsole.succeed("CONTROLLER!");
          this.resetTimeout(reje);
          reso();
        }
      });
      setTimeout(() => {
        this.stop();
        reje(new DebugJsonSerialportError("ENOENT"));
      }, 1e4);
    });
  }
};
var SimulatedController = class {
  constructor(parameters) {
    this.parameters = parameters;
  }
  static {
    __name(this, "SimulatedController");
  }
  intervals = [];
  async start(onMessage) {
    for (const label of Object.keys(this.parameters)) {
      this.intervals.push(
        setInterval(() => {
          onMessage(
            this.generateData(
              label,
              this.parameters[label].min,
              this.parameters[label].max
            )
          );
        }, this.parameters[label].interval)
      );
    }
  }
  write() {
  }
  async stop() {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
  }
  /**
   * Generate a single data point
   * @param label Dataset label
   * @param min Minimum value
   * @param max Maximum value
   */
  generateData(label, min, max) {
    let d = Math.random() * (max - min) + min;
    return {
      type: "event",
      data: {
        [label]: d
      }
    };
  }
};
export {
  CONTROLLER_REVISION,
  MicroController,
  SimulatedController,
  findSerialPort
};
