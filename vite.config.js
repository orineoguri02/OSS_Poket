import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 모든 네트워크 인터페이스에서 접근 가능
    port: 5173,
    open: true, // 자동으로 브라우저 열기
  },
})
