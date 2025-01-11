import esbuild from 'esbuild';
import {
  esbuildPluginFilePathExtensions
} from 'esbuild-plugin-file-path-extensions';

console.log('Building API...');

// Build API
// const build_api = 
await esbuild.build({
  format: 'esm',
  platform: 'node',
  target: 'esnext',
  packages: 'external',
  bundle: true,
  entryPoints: ['./api/*.ts'],
  outdir: './api/',
  allowOverwrite: true,
  keepNames: true,
  outExtension: { '.js': '.mjs' },
  tsconfig: './api.tsconfig.json',
  external: ['debug', 'ora', 'chalk', 'socket.io', 'blessed'],
  plugins: [esbuildPluginFilePathExtensions({
    esm: true,
    esmExtension: 'mjs',
    filter: /^\..*\.(js|ts)$/ // '.*.js' or '.*.ts'
  })]
}).catch((err) => { console.error(err); process.exit(1); } );

// Build next.config.js
// const build_config = esbuild.build({
//   format: 'cjs',
//   platform: 'node',
//   target: 'esnext',
//   packages: 'external',
//   bundle: true,
//   entryPoints: ['./next.config.ts'],
//   outdir: './',
//   allowOverwrite: true,
//   keepNames: true,
//   plugins: [esbuildPluginFilePathExtensions({
//     esm: false,
//   })]
// }).catch(() => process.exit(1));

// await Promise.all([build_api, build_config]);