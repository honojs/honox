import { glob } from 'glob'
import { defineConfig } from 'tsup'

const entryPoints = glob.sync('./src/**/*.+(ts|tsx|json)', {
  ignore: ['./src/**/*.test.+(ts|tsx)'],
})

export default defineConfig({
  entry: entryPoints,
  dts: true,
  splitting: false,
  minify: false,
  format: ['esm'],
  bundle: false,
  platform: 'node',
})
