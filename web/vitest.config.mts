import { defineConfig } from "vitest/config";
import path from "node:path";

// Test files run one at a time, on one connection: the integration tests share one single-session scratch database.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  test: { fileParallelism: false, env: { DB_POOL_MAX: "1" } },
});
