import chalk from 'chalk';
import { ReadlineParser, SerialPort } from 'serialport';
import { ControllerTXError, DebugJsonSerialportError } from './errors';
import ui from './ui';
// import { Gpio } from 'onoff';./utils
import { DebugJsonMessage } from './types';

// CONSTANTS

/**
 * Baud rate for serial communication. Must match that found in microcontroller code.
 */
const BAUDRATE = 115200;

/**
 * Microcontroller software revision matching this software.
 */
export const CONTROLLER_REVISION = 0; // Just zero for now

/**
 * Seconds to wait between messages before timing out.
 */
const SERIAL_TIMEOUT_SECONDS = 3;

/**
 * GPIO pin attached to the reset grounding circuit
 */
// const RESET_PIN = 26;

// TYPES

/**
 * Base type for any controller.
 */
export type Controller = {
  /**
   * Establish communications with the Controller.
   * @param onMessage Pipe all received messages.
   * @throws If received message is invalid (JSON parsing fails).
   */
  // start(onMessage: (msg: ControllerMessage) => void): Promise<void>;
  start(onMessage: (msg: DebugJsonMessage) => void): Promise<void>;

  /**
   * Write instructions to the Controller.
   * @param instructions Instruction set.
   */
  // write(instructions: ControllerInstructions): void;
  write(instructions: DebugJsonMessage): void;

  /**
   * Halt communications with the Controller.
   */
  stop(): void;
};

/**
 * Messages FROM the controller
 */
// export type ControllerMessage =
// 	| {
// 			type: 'info' | 'debug' | 'error';
// 			data: string;
// 	  }
// 	| {
// 			type: 'data';
// 			data: {
// 				label: string;
// 				value: number;
// 			};
// 	  }
// 	| {
// 			type: 'revision';
// 			data: number;
// 	  };

/**
 * Messages TO the controller
 */
// export type ControllerInstructions = {
// 	[key: string]: number;
// };

/**
 * Simulated controller parameters
 */
export type SimulatorConfig = {
  [key: string]: {
    min: number;
    max: number;
    interval: number;
  };
};

// CLASSES

/**
 * Interface between this computer and the microcontroller.
 */
export class MicroController implements Controller {
  serial: SerialPort;
  parser: ReadlineParser;
  private timeout?: NodeJS.Timeout;
  // private resetpin: Gpio;

  constructor(readonly serialport: string, readonly passRevision: boolean = true) {
    // Reset pin GPIO interface
    // this.resetpin = new Gpio(RESET_PIN, 'out');

    // Create the serial port interface
    this.serial = new SerialPort({
      path: serialport,
      baudRate: BAUDRATE,
      autoOpen: false,
    });

    this.serial.on('error', async (err) => {
      // ui.fail(`CONTROLLER SERIAL: ${err}`);
      throw new DebugJsonSerialportError(`${err.name} - ${err.message}`);
    });

    // Create the newline parser
    this.parser = this.serial.pipe(
      new ReadlineParser({
        delimiter: '\n',
        includeDelimiter: false,
      })
    );
  }

  // Starts serial (newline parser) and resolves when RX revision is correct
  start(onMessage: (msg: DebugJsonMessage) => void): Promise<void> {
    this.clearTimeout();
    // Reset listeners
    this.parser.removeAllListeners('data');

    // Explicit promise construction so we can resolve only on valid comms AND revision check
    return new Promise<void>(async (res, rej) => {
      
      // Reset the microcontroller (opens the serial port)
      this.reset().catch((err) => rej(err)).then(() => {
        this.resetTimeout(rej);
        ui.start('CONTROLLER REVISION...');
      });

      this.parser.on('error', async (err) => {
        await this.reset().catch((err) => rej(new DebugJsonSerialportError(`${err.name} - ${err.message}`)));
      });

      // Set up the listener
      this.parser.on('data', async (msgtxt) => {
        this.resetTimeout(rej);
        
        // Attempt to parse the raw text as a valid JSON object
        let msg: DebugJsonMessage;
        try {
          msg = JSON.parse(msgtxt);
        } catch (err) {
          rej(err);
          return;
        }

        // Microcontroller-specific pre-handling
        switch (msg.type) {
          case 'revision':
            // Software update
            if (msg.data?.revision === CONTROLLER_REVISION) {
              if(ui.spinning()) {
                ui.succeed(
                  `CONTROLLER REVISION PASS! ${msg.data.revision}`
                );
              }
              res(); //Successful start sequence
            } else {
              ui.fail(
                `CONTROLLER REVISION FAIL: ${msg.data?.revision ?? 'NULL'} != ${CONTROLLER_REVISION}`
              );
              // Attempt to update the microcontroller, and then restart
              this.stop();
              // ui.start('Compiling latest microcontroller software and flashing...');
              // await updateMicrocontroller();
              // ui.succeed('Updated microcontroller software successfully!');
            }
          if(this.passRevision === false) break;
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
  private clearTimeout(): void {
    if (this.timeout) clearTimeout(this.timeout);
  }

  /**
   * Refresh (or start) the serial timeout.
   */
  private resetTimeout(cb?: (err: any) => void, timeoutSeconds: number = SERIAL_TIMEOUT_SECONDS): void {
    this.clearTimeout();
    this.timeout = setTimeout(() => {
      // ui.fail(
      //   `CONTROLLER TIMEOUT: ${timeoutSeconds}s`
      // );
      this.reset().catch((err) => {if(cb) cb(err)});
    }, timeoutSeconds * 1000);
  }

  write(msg: DebugJsonMessage): void {
    ui.info(`[${chalk.yellow('WRITE')}] - ${JSON.stringify(msg)}`);
    this.serial.write(JSON.stringify(msg) + '\n', undefined, (err) => {
      if (err) throw new ControllerTXError(JSON.stringify(msg));
    });
  }

  stop(): void {
    this.clearTimeout();
    if (this.serial.isOpen) this.serial.close();
    // Stop listening for data
    // this.parser.removeAllListeners('data');
  }

  /**
   * Resets the microcontroller by closing and re-opening serial.
   */
  private reset(): Promise<void> {
    // Stop and reset
    this.stop();
    // this.resetpin.writeSync(1);

    // Wait, then stop resetting
    // await new Promise<void>((r) => setTimeout(r, 1000));
    // this.resetpin.writeSync(0);

    // (Re-)open serial
    return new Promise<void>((reso, reje) => {
      ui.start('CONTROLLER...');
      this.serial.open((err) => {
        if (err) {
          reje(err);
        } else {
          ui.succeed('CONTROLLER!');
          this.resetTimeout();
          reso();
        }
      });
      setTimeout(() => {
        // ui.fail('CONTROLLER ENOENT TIMEOUT');
        this.stop();
        reje(new DebugJsonSerialportError('ENOENT'));
      }, 10000);
    });

    // Restart timeout
  }
}

/**
 * A simulated controller for generating random data.
 */
export class SimulatedController implements Controller {
  private intervals: NodeJS.Timeout[] = [];

  constructor(readonly parameters: SimulatorConfig) {}

  async start(onMessage: (msg: DebugJsonMessage) => any): Promise<void> {
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
  write() {}
  async stop(): Promise<void> {
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
  private generateData(
    label: string,
    min: number,
    max: number
  ): DebugJsonMessage {
		let d = (Math.random() * (max - min) + min);
    return {
      type: 'telemetry',
      data: {
        [label]: d,
      },
    };
  }
}
