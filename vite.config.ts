import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  return {
    plugins: [react()],
    define: {
      'process.env': JSON.stringify({
        REACT_APP_GOOGLE_SCRIPT_ID: env.REACT_APP_GOOGLE_SCRIPT_ID,
        REACT_APP_GOOGLE_SCRIPT_URL: env.REACT_APP_GOOGLE_SCRIPT_URL,
        REACT_APP_NEON_API_URL: env.REACT_APP_NEON_API_URL,
        REACT_APP_NEON_AUTH_URL: env.REACT_APP_NEON_AUTH_URL,
        REACT_APP_NEON_PUBLIC_STACK_PROJECT_ID: env.REACT_APP_NEON_PUBLIC_STACK_PROJECT_ID,
        REACT_APP_NEON_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: env.REACT_APP_NEON_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
        REACT_APP_NEON_SECRET_SERVER_KEY: env.REACT_APP_NEON_SECRET_SERVER_KEY,
        REACT_APP_NEON_REFRESH_TOKEN: env.REACT_APP_NEON_REFRESH_TOKEN,
        REACT_APP_NEON_AUTH_USER_ID: env.REACT_APP_NEON_AUTH_USER_ID,
        NODE_ENV: JSON.stringify(isDev ? 'development' : 'production'),
        DEBUG: isDev,
      }),
      global: 'globalThis',
      'process.browser': true,
    },
    server: {
      port: 3002,
      host: true,
      open: true,
      strictPort: true,
      hmr: {
        overlay: true,
        port: 3003,
      },
    },
    envPrefix: 'REACT_APP_',
  }
})

