# DebugJson.js

Complement to DebugJson for Arduino. Stream transciever (i.e. UART Serial) for JSON-formatted and delinteated messages (i.e. '\n') with the following schema:

<!-- TODO: Finish readme (i.e. esbuild/tsc setup, api, Next setup, etc.) -->
<!-- TODO: Fix microcontroller discovery, serial port autofind -->
<!--  -->

```ts
type DebugJsonMessageTypes = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

enum _DebugJsonDataType {
  UINT = 0,
  INT = -1,
  BOOL = NaN,
}

type DebugJsonDataType = _DebugJsonDataType | number; // Either specified integer

/**
 * number x = 3.14f;
 * DebugJsonDatum datum = x; datum.t = 2;
 *
 * number x = 1;
 * DebugJsonDatum datum = x; datum.t = 0;
 *
 * number x = -512;
 * DebugJsonDatum datum = x; datum.t = -1;
 *
 * number x = true; // Default; false if x === false or 0, otherwise true (i.e. if key exists on JSON object but is null)
 * DebugJsonDatum datum = x; datum.t = NaN;
 */
type DebugJsonDatum = number & {
  t: DebugJsonDataType; // * Required; 0 = integer, < 0 = boolean, > 0 = floating-point precision
};

type DebugJsonMessage = {
  type: DebugJsonMessageTypes; // * Required; Usually first in a stream
  t?: string; // Additional message typing i.e. device IDs, "WARN", "BSOD", etc.
  timestamp: number; // ** Suggested; Milliseconds since t=revision sent (or program start)
  msg?: string;
  data?: {
    [key: string]: boolean | number | number[] | string; // I.e. {"temperature": 25.0, "button0": true, "nav": "~/mydir/"}
    // We'll handle floating-point precision at deserialization time, create a class DebugJsonNumber
  };
  units?: {
    [key: string]: string; // I.e. "temperature": "°C"
  };
};
```

# Usage

<!-- TODO -->

# Development

<!-- TODO: Justify Serial Ports -->

## Overview

1. Install Yarn: `npm install --global yarn; yarn init; rm package-lock.json; yarn`

2. Create the app: `yarn create next-app --typescript`

3. Add ESLint: `npx eslint --init`

4. Addd the following to `eslint.json`:

```json
"extends" : [
    //...
    "prettier"
]
```

5. Add and run prettier: `yarn add --dev --exact prettier eslint-config-prettier; yarn prettier`

6. Create `.prettierrc.json`:

```bash
echo $'{
  "semi" : true,
  "singleQuote" : true,
  "useTabs": false
  "tabWidth" : 2,
  "printWidth" : 80,
  "trailingComma" : "es5",
  "bracketSpacing" : true,
  "arrowParens" : "always",
  "endOfLine" : "lf"

}'> .prettierrc.json
```

7. Add the following to `package.json/scripts{...}`:

```json
"scripts" : {
  // ...
  "eslint" : "eslint src/**",
  "prettier" : "prettier --write ."
}
```

8. Install MaterialUI: `yarn add @mui/material @emotion/react @emotion/styled @mui/icons-material`

9. Install Next.js: `yarn add next`

10. Install PostCSS/Tailwind CSS: `yarn add tailwindcss postcss autoprefixer`

yarn add uuid yargs jest dotenv serialport

yarn add --dev @types/uuid @types/yargs @types/jest @types/dotenv @types/serialport

## Architecture

- Host: This Device (See OSX/Linux/WSL; Raspberry Pi)
- (Micro-)Controller: Target (i.e. UART Arduino/ESP32)

### OSX, Linux, WSL

<!-- See Oreille, PeaPod/software -->

### Raspberry Pi

<!-- See: Revision -> Controller JTAG ROM Flash -->
<!-- yarn add serialport onoff -->

yarn add --dev @types/pi-camera

## Logging and Control

<!-- "@types/project-name-generator": "^2.1.0" -->

### Local: Node.JS Console, File I/O

yarn add ora blessed chalk
yarn add --dev @types/ora @types/blessed @types/chalk

### Remote: WebSockets, SQL, Firebase

yarn add jsonwebtoken
yarn add --dev @types/jsonwebtoken
