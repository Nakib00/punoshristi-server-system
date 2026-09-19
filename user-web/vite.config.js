import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
const HTTPS_DISABLED_FOR_LOCAL_PREVIEW = process.env.PUNOSHRISTI_NO_HTTPS === '1';

export default defineConfig({
  plugins: [react(), ...(HTTPS_DISABLED_FOR_LOCAL_PREVIEW ? [] : [basicSsl()])],
  server: {
    host: '0.0.0.0',
    port: 5181,
    https: !HTTPS_DISABLED_FOR_LOCAL_PREVIEW,
  },
})
