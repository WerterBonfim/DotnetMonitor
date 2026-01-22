import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: host || false,
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    hmr: host
      ? {
          protocol: 'ws',
          host: host,
          port: 1430
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: process.env.TAURI_PLATFORM === 'windows'
      ? 'chrome105'
      : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React e React DOM
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separar biblioteca de gráficos (Recharts é grande)
          'charts-vendor': ['recharts'],
          // Separar React Query
          'query-vendor': ['@tanstack/react-query'],
          // Separar UI components (shadcn/ui)
          'ui-vendor': [
            'lucide-react',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'next-themes'
          ],
          // Separar axios
          'http-vendor': ['axios'],
        },
      },
    },
  },
  envPrefix: ['VITE_', 'TAURI_PLATFORM', 'TAURI_ARCH', 'TAURI_FAMILY', 'TAURI_PLATFORM_VERSION', 'TAURI_PLATFORM_TYPE', 'TAURI_DEBUG']
})
