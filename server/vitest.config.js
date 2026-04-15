import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Each test file gets its own module registry so vi.spyOn works cleanly
    isolate: true,
  },
})
