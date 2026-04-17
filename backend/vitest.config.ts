import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    hookTimeout: 30_000,
    testTimeout: 15_000,
    // Tests share a real Postgres. Run test files sequentially so the
    // beforeEach TRUNCATE in one file doesn't race with another file's
    // writes, and so module-level vi.mock() calls don't leak across files.
    // Vitest 4 flattened pool options to top level.
    pool: 'forks',
    fileParallelism: false,
    poolOptions: { forks: { singleFork: true } },
  },
});
