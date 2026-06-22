import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  resolve: {
    // daisyui's package "exports" map doesn't expose its CSS entry in a way
    // Vite 8 can resolve, so point the bare specifier at its JS index.
    alias: {
      daisyui: 'daisyui/index.js',
    },
  },
  plugins: [
    tailwindcss(),
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        minifyJS: true,
      },
    }),
  ],
});
