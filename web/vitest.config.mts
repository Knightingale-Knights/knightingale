import { defineConfig } from "vitest/config";
import path from "node:path";

// Test files run one at a time: the integration tests share one scratch database.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  test: { fileParallelism: false },
});
