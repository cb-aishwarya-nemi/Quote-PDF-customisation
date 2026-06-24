import { cpSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

const require = createRequire(import.meta.url)
const pdfjsDistRoot = path.dirname(require.resolve("pdfjs-dist/package.json"))
const pdfJsPublicRoot = path.resolve(__dirname, "public/pdfjs")

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
  plugins: [react(), pdfJsAssetsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
})
