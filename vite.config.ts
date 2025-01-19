import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "./src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format, name) => {
        console.log(format, name);
        return format === "es" ? "esm/index.js" : "cjs/index.cjs"
      }
    },
    rollupOptions: {
      external: "crypto"
    },
    minify: false
  }
});
