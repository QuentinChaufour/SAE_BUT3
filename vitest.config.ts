import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineVitestConfig({
  resolve: {
    alias: {
      '~~': projectRoot,
      '~': resolve(projectRoot, 'app')
    }
  },
  test: {
    environment: 'nuxt',

    coverage: {
      enabled: true,
      exclude: ['app/app.vue', 'server/utils/prisma.ts'],
      include: [
        'app/**/*.{ts,vue}',
        'server/**/*.ts',
        'shared/**/*.ts'
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80
      }
    }
  }
})
