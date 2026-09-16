import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const fastApiBackendUrl =
  process.env.VITE_DEV_API_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: fastApiBackendUrl,
        changeOrigin: true,
      },
    },
  },
});
