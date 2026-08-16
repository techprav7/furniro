import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin to generate 404.html fallback on build for SPA routing without server config files
const spaFallbackPlugin = () => ({
  name: "spa-fallback",
  closeBundle() {
    const distDir = path.resolve(__dirname, "dist");
    const indexPath = path.join(distDir, "index.html");
    const notFoundPath = path.join(distDir, "404.html");
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, notFoundPath);
    }
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallbackPlugin()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
