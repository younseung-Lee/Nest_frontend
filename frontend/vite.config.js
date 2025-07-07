import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 환경에 따른 프록시 대상 결정
  const getProxyTarget = () => {
    if (mode === 'server1') {
      return 'http://localhost:8080'
    } else if (mode === 'server2') {
      return 'http://localhost:8001'
    }
    // 기본값 (mode가 지정되지 않은 경우)
    return 'http://localhost:8001'
  }

  // 환경에 따른 포트 결정
  const getPort = () => {
    if (mode === 'server1') {
      return 3000
    } else if (mode === 'server2') {
      return 3001
    }
    // 기본값
    return 3001
  }

  return {
    plugins: [
      react(),
      svgr()
    ],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    },
    server: {
      port: getPort(),
      open: true,
      proxy: {
        '/api': {
          target: getProxyTarget(),
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'build',
      sourcemap: true
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    define: {
      global: 'globalThis',
    },
  }
})
