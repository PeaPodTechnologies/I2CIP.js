var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

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
var ui_default = DebugJsonConsole;
function _logRedirect(message) {
  DebugJsonConsole.log(message);
}
__name(_logRedirect, "_logRedirect");
function _errRedirect(message) {
  DebugJsonConsole.err(message);
}
__name(_errRedirect, "_errRedirect");
export {
  DebugJsonConsole,
  _errRedirect,
  _logRedirect,
  ui_default as default
};
