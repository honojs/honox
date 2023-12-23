import { defineConfig } from 'vitest/config'
import { islandComponents } from '../../src/vite/island-components'

export default defineConfig({
  test: {
    globals: true,
  },
  plugins: [islandComponents()],
})
