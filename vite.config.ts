import { cpSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import basicSsl from "@vitejs/plugin-basic-ssl"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

const require = createRequire(import.meta.url)
const pdfjsDistRoot = path.dirname(require.resolve("pdfjs-dist/package.json"))
const pdfJsPublicRoot = path.resolve(__dirname, "public/pdfjs")

const DEV_PORT = 5173
const PREVIEW_PORT = 4173
const cursorDev = process.env.VITE_CURSOR_DEV === "1"

function syncPdfJsAssets() {
  for (const dir of ["standard_fonts", "wasm", "cmaps"] as const) {
    cpSync(path.join(pdfjsDistRoot, dir), path.join(pdfJsPublicRoot, dir), {
      recursive: true,
    })
  }
}

function pdfJsAssetsPlugin(): Plugin {
  return {
    name: "sync-pdfjs-assets",
    buildStart() {
      syncPdfJsAssets()
    },
    configureServer() {
      syncPdfJsAssets()
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    pdfJsAssetsPlugin(),
    ...(cursorDev ? [basicSsl()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: cursorDev ? "0.0.0.0" : "localhost",
    port: DEV_PORT,
    strictPort: false,
    cors: true,
    origin: cursorDev
      ? `https://localhost:${DEV_PORT}`
      : `http://localhost:${DEV_PORT}`,
    hmr: cursorDev
      ? false
      : {
          host: "localhost",
          port: DEV_PORT,
          protocol: "ws",
        },
  },
  preview: {
    host: "0.0.0.0",
    port: PREVIEW_PORT,
    strictPort: false,
    cors: true,
  },
})
