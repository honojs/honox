import honox from 'honox/vite'
import { defineConfig } from '../../node_modules/vite'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: ['./app/client.ts'],
          output: {
            entryFileNames: 'static/client.js',
            chunkFileNames: 'static/assets/[name]-[hash].js',
            assetFileNames: 'static/assets/[name].[ext]',
          },
        },
        emptyOutDir: false,
        copyPublicDir: false,
      },
    }
  } else {
    return {
      build: {
        rollupOptions: {
          output: {
            entryFileNames: '_worker.js',
          },
        },
        minify: true,
      },
      plugins: [honox()],
    }
  }
})
