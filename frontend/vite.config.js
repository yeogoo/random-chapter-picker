import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "../backend/public", // 빌드 결과물을 백엔드 폴더로 저장
  },
  base: "./",
  server: {
    proxy: {
      "/api": "http://0:0:0:0:8080", // API 요청을 백엔드로 프록시
    },
  },
});
