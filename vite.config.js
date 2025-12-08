import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 모든 네트워크 인터페이스에서 접근 가능
    port: 5173,
    open: true, // 자동으로 브라우저 열기
    historyApiFallback: true, // SPA 라우팅을 위한 히스토리 폴백
  },
})
