import { defineConfig } from "vite";

export default defineConfig({
  server: { host: true, port: 5174 },   // host:true -> mở được từ điện thoại cùng wifi
  build: { target: "es2022" },
});
