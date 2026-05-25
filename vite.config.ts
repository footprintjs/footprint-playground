import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/footprint-playground/",
  // Dedupe React + xyflow so there's exactly ONE copy of each, even
  // when sibling `file:` deps (explainable-ui) have their own
  // node_modules copies. Without dedupe, xyflow loaded via the
  // sibling resolves React relatively, producing two React instances
  // → "Invalid hook call" errors. Adding the package names here
  // forces Vite to resolve all imports to the playground's copy.
  resolve: {
    dedupe: ["react", "react-dom", "@xyflow/react"],
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, ".."),
      ],
    },
  },
});
