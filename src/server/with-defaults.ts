import type { Env } from 'hono'
import { createApp as baseCreateApp } from './server.js'
import type { ServerOptions } from './server.js'

export const createApp = <E extends Env>(options?: ServerOptions<E>) => {
  const newOptions = {
    root: options?.root ?? '/app/routes',
    app: options?.app,
    init: options?.init,
    trailingSlash: options?.trailingSlash,
    // Avoid brace expansion and extglobs for rolldown-vite compatibility
    // ref: https://github.com/vitejs/rolldown-vite/issues/365
    NOT_FOUND:
      options?.NOT_FOUND ??
      import.meta.glob(['/app/routes/**/_404.ts', '/app/routes/**/_404.tsx'], {
        eager: true,
      }),
    ERROR:
      options?.ERROR ??
      import.meta.glob(['/app/routes/**/_error.ts', '/app/routes/**/_error.tsx'], {
        eager: true,
      }),
    RENDERER:
      options?.RENDERER ??
      import.meta.glob('/app/routes/**/_renderer.tsx', {
        eager: true,
      }),
    MIDDLEWARE:
      options?.MIDDLEWARE ??
      import.meta.glob(['/app/routes/**/_middleware.ts', '/app/routes/**/_middleware.tsx'], {
        eager: true,
      }),
    ROUTES:
      options?.ROUTES ??
      import.meta.glob(
        [
          '/app/routes/**/*.ts',
          '/app/routes/**/*.tsx',
          '/app/routes/**/*.md',
          '/app/routes/**/*.mdx',
          '/app/routes/.well-known/**/*.ts',
          '/app/routes/.well-known/**/*.tsx',
          '/app/routes/.well-known/**/*.md',
          '/app/routes/.well-known/**/*.mdx',
          '!/app/routes/**/_*.ts',
          '!/app/routes/**/_*.tsx',
          '!/app/routes/**/_*.md',
          '!/app/routes/**/_*.mdx',
          '!/app/routes/**/-*.ts',
          '!/app/routes/**/-*.tsx',
          '!/app/routes/**/-*.md',
          '!/app/routes/**/-*.mdx',
          '!/app/routes/**/$*.ts',
          '!/app/routes/**/$*.tsx',
          '!/app/routes/**/$*.md',
          '!/app/routes/**/$*.mdx',
          '!/app/routes/**/*.test.ts',
          '!/app/routes/**/*.test.tsx',
          '!/app/routes/**/*.spec.ts',
          '!/app/routes/**/*.spec.tsx',
          '!/app/routes/**/-*/**/*',
        ],
        {
          eager: true,
        }
      ),
  }

  return baseCreateApp(newOptions)
}
