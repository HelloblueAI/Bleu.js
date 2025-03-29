import { defineConfig } from 'rollup';
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    assetFileNames: '[name]-[hash][extname]'
  },
  plugins: [
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: true,
      output: {
        comments: false
      }
    })
  ]
}); 