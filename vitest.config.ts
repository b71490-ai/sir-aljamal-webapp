import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": "src/test/mocks/server-only.ts",
    },
  },
  test: {
    environment: "node",
  },
});
