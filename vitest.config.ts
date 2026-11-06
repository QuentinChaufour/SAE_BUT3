import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~~': rootDir,
      '~': rootDir
    }
  },
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node'
        }
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.{test,spec}.ts'],
          environment: 'node'
        }
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt'
        }
      })
    ],
    coverage: {
      enabled: true,
      exclude: ['app/app.vue', 'server/utils/prisma.ts', 'app/app.config.ts'],
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
