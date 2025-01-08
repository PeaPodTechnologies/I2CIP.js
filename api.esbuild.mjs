import esbuild from 'esbuild';
import {
  esbuildPluginFilePathExtensions
} from 'esbuild-plugin-file-path-extensions';

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
  plugins: [esbuildPluginFilePathExtensions({
    esm: true,
    esmExtension: 'mjs',
  })]
}).catch(() => process.exit(1));