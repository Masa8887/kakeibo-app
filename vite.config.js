import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // 開発時は /api へのリクエストをバックエンド(Express)に転送する
    proxy: {
      "/api": `http://localhost:${process.env.PORT || 3001}`,
    },
  },
});
