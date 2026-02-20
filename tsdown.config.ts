import { glob } from 'glob'
import { defineConfig } from 'tsdown'

const entryPoints = glob.sync('./src/**/*.+(ts|tsx|json)', {
  posix: true,
  ignore: ['./src/**/*.test.+(ts|tsx)'],
})

export default defineConfig({
  entry: entryPoints,
  dts: true,
  minify: false,
  format: ['esm'],
  unbundle: true,
  platform: 'node',
  clean: true,
  target: false,
  external: ['fsevents', 'vite'],
  fixedExtension: false,
  globImport: false,
  exports: true,
})
