// Static build for GitHub Pages (or any plain file host). Output: ./dist-static
// Run: bun run build:static   — then upload the CONTENTS of dist-static to your repo.
// `base: "./"` keeps every path relative, so it works under /<repo-name>/ too.
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname, "static-site"),
  base: "./",
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: {
    outDir: path.resolve(__dirname, "dist-static"),
    emptyOutDir: true,
  },
});
