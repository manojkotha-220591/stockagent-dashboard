import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GITHUB_PAGES_BASE is set by the deploy workflow to "/<repo-name>/" so
// assets resolve correctly under https://<user>.github.io/<repo-name>/.
// Defaults to "/" for local dev (`npm run dev` / `npm run preview`).
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES_BASE || "/",
});
