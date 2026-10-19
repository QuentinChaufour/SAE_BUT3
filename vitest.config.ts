import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      thresholds: {
        lines: 80,
        perFile: {
          100: true
        }
      }
    }
  }
})
