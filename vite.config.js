import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig({
  resolve: {
    alias: {
      daisyui: "daisyui/index.js",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
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
