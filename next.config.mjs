// next.config.ts
console.log('Using next.config with Node Version:', process.version);
var nextConfig = {
  /* config options here */
  typescript: {
    tsconfigPath: './next.tsconfig.json'
  },
  output: 'standalone'
};
var next_config_default = nextConfig;
export {
  next_config_default as default
};
