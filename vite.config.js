import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 모든 네트워크 인터페이스에서 접근 가능
    port: 5173,
    open: true, // 자동으로 브라우저 열기
    historyApiFallback: true, // SPA 라우팅을 위한 히스토리 폴백
  },
  build: {
    // 빌드 최적화 설정
    target: "esnext",
    minify: "esbuild", // 빠른 압축
    chunkSizeWarningLimit: 1000, // 청크 크기 경고 임계값
    rollupOptions: {
      output: {
        // 코드 스플리팅 최적화
        manualChunks: {
          // Three.js 관련 라이브러리를 별도 청크로 분리
          "three-core": ["three"],
          "three-drei": ["@react-three/drei"],
          "three-fiber": ["@react-three/fiber"],
          // React 관련 라이브러리 분리
          "react-vendor": ["react", "react-dom", "react-router-dom"],
        },
        // 파일명 최적화
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    // 소스맵 생성 비활성화 (프로덕션 빌드 크기 감소)
    sourcemap: false,
  },
  // 정적 파일 최적화
  assetsInclude: ["**/*.dae", "**/*.fbx", "**/*.obj", "**/*.glb", "**/*.gltf"],
});
