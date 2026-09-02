import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: false,
  splitting: false,
  bundle: true,
  // Keep npm deps external so CJS packages (axios → form-data) load via Node at runtime.
  skipNodeModulesBundle: true,
  outDir: 'dist',
  target: 'node18',
  platform: 'node',
  sourcemap: true,
  treeshake: true,
});
