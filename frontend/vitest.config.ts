import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same alias as tsconfig.json ("@/*" → project root).
    alias: { "@": new URL(".", import.meta.url).pathname },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
