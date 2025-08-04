import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, import.meta.dirname, '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT) || 3001,
      open: true,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8081',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (_err, _req, _res) => {
              // Proxy error handling
            });
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              // Content-Length 헤더 제거
              proxyReq.removeHeader('content-length');
              // Origin 헤더 제거 (CORS 문제 해결)
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
            proxy.on('proxyRes', (_proxyRes, _req, _res) => {
              // Response handling
            });
          },
        }
      }
    },
    build: {
      outDir: 'build',
      sourcemap: true
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    }
  }
}) 