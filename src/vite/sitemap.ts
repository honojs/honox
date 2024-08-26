import type { Plugin, TransformResult } from 'vite'
import path, { resolve } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

export type SitemapOptions = {
  hostname?: string
  exclude?: string[]
  frequency?: Record<string, Frequency>
  priority?: Record<string, string>
  outputFileName?: string
  routesDir?: string
}

export const defaultOptions: SitemapOptions = {
  hostname: 'localhost:5173',
  exclude: [],
  frequency: {},
  priority: {},
  outputFileName: 'sitemap.xml',
  routesDir: '/app/routes',
}

type Frequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

const tsFiles: string[] = []

/**
 * Vite plugin to generate a sitemap.xml file.
 * @param options
 * @param {string} [options.hostname='localhost:5173'] - The hostname of the website.
 * @param {string[]} [options.exclude=[]] - The list of files to exclude.
 * @param {Record<string, string>} [options.frequency] - The frequency of the pages.
 * @param {Record<string, string>} [options.priority] - The priority of the pages.
 * @param {string} [options.outputFileName='sitemap.xml'] - The name of the output file.
 * @param {string} [options.routesDir='/app/routes'] - The directory where the routes are located.
 * @returns {Plugin}
 * @example
 * ```ts
 * import sitemap from 'honox/vite/sitemap'
 *
 * export default defineConfig({
 *  plugins: [
 *   sitemap({
 *    hostname: 'https://example.com',
 *    exclude: ['/secrets/*', '/user/*'],
 *    frequency: { '/': 'daily', '/about': 'monthly', '/posts/*': 'weekly' },
 *    priority: { '/': '1.0', '/about': '0.8', '/posts/*': '0.5' },
 *   }),
 *  ],
 * })
 * ```
 */
export function sitemap(options?: SitemapOptions): Plugin {
  validateOptions(options)
  const hostname = options?.hostname ?? defaultOptions.hostname ?? 'localhost:5173'
  const exclude = options?.exclude ?? defaultOptions.exclude ?? []
  const frequency = options?.frequency ?? defaultOptions.frequency ?? {}
  const priority = options?.priority ?? defaultOptions.priority ?? {}
  const outputFileName = options?.outputFileName ?? defaultOptions.outputFileName ?? 'sitemap.xml'
  const routesDir = options?.routesDir ?? defaultOptions.routesDir ?? '/app/routes'

  return {
    name: 'vite-plugin-hono-sitemap',
    apply: 'build',
    transform(_code: string, id: string): TransformResult {
      if (isFilePathMatch(id, exclude)) {
        tsFiles.push(id)
      }
      return { code: _code, map: null }
    },

    buildEnd() {
      const routes = processRoutes(tsFiles, hostname, routesDir, frequency, priority)

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (page) => `
  <url>
    <loc>${page.url}/</loc>
    <lastmod>${page.lastMod}</lastmod>
    <changefreq>${page.changeFreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
  )
  .join('')}
</urlset>`

      try {
        const distPath = path.resolve(process.cwd(), 'dist')
        // Create the dist directory if it doesn't exist
        if (!existsSync(distPath)) {
          mkdirSync(distPath, { recursive: true })
        }
        writeFileSync(resolve(process.cwd(), 'dist', outputFileName), sitemap)
        console.info(`Sitemap generated successfully: ${outputFileName}`)
      } catch (error) {
        console.error(`Failed to write sitemap file: ${error}`)
        throw new Error(`Sitemap generation failed: ${error}`)
      }
    },
  }
}

/**
 * Check if the file path matches the pattern.
 * @param filePath
 * @returns {boolean}
 */
export function isFilePathMatch(filePath: string, exclude: string[]): boolean {
  const patterns = [
    '.*/app/routes/(?!.*(_|\\$|\\.test|\\.spec))[^/]+\\.(tsx|md|mdx)$',
    '.*/app/routes/.+/(?!.*(_|\\$|\\.test|\\.spec))[^/]+\\.(tsx|md|mdx)$',
    '.*/app/routes/\\.well-known/(?!.*(_|\\$|\\.test|\\.spec))[^/]+\\.(tsx|md|mdx)$',
  ]

  const normalizedPath = path.normalize(filePath).replace(/\\/g, '/')

  // Check if the file is excluded
  if (exclude.some((excludePath) => normalizedPath.includes(excludePath))) {
    return false
  }

  for (const pattern of patterns) {
    const regex = new RegExp(`^${pattern}$`)
    if (regex.test(normalizedPath)) {
      return true
    }
  }

  return false
}

export function validateOptions(options?: SitemapOptions): void {
  if (options === undefined) {
    return
  }
  if (options.hostname && !/^(http:\/\/|https:\/\/)/.test(options.hostname)) {
    throw new Error('hostname must start with http:// or https://')
  }

  if (options.priority) {
    for (const [key, value] of Object.entries(options.priority)) {
      const priority = Number.parseFloat(value)
      if (Number.isNaN(priority) || priority < 0 || priority > 1) {
        throw new Error(`Invalid priority value for ${key}: ${value}. Must be between 0.0 and 1.0`)
      }
    }
  }

  if (options.frequency) {
    const validFrequencies: Frequency[] = [
      'always',
      'hourly',
      'daily',
      'weekly',
      'monthly',
      'yearly',
      'never',
    ]
    for (const [key, value] of Object.entries(options.frequency)) {
      if (!validFrequencies.includes(value)) {
        throw new Error(`Invalid frequency value for ${key}: ${value}`)
      }
    }
  }
}

/**
 * Process the routes.
 * @param files
 * @param hostname
 * @param routesDir
 * @param frequency
 * @param priority
 * @returns {Array<{ url: string; lastMod: string; changeFreq: string; priority: string }>}
 */
export function processRoutes(
  files: string[],
  hostname: string,
  routesDir: string,
  frequency: Record<string, Frequency>,
  priority: Record<string, string>
): { url: string; lastMod: string; changeFreq: string; priority: string }[] {
  const modifiedHostname = hostname.endsWith('/') ? hostname.slice(0, -1) : hostname
  return files.map((file) => {
    const route = file.substring(file.indexOf(routesDir) + routesDir.length)
    const withoutExtension = route.replace(/\.(tsx|mdx)$/, '')
    const url =
      withoutExtension === '/index' ? modifiedHostname : `${modifiedHostname}${withoutExtension}`
    return {
      url,
      lastMod: new Date().toISOString(),
      changeFreq: getFrequency(withoutExtension, frequency),
      priority: getPriority(withoutExtension, priority),
    }
  })
}

/**
 * Get the frequency for a given URL.
 * @param url
 * @returns {string}
 */
export function getFrequency(url: string, frequency: Record<string, string>): string {
  return getValueForUrl(url, frequency, 'weekly')
}

/**
 * Get the priority for a given URL.
 * @param url
 * @returns {string}
 */
export function getPriority(url: string, priority: Record<string, string>): string {
  return getValueForUrl(url, priority, '0.5')
}

/**
 * Get the value for a given URL based on patterns, checking from most specific to least specific.
 * @param url
 * @param patterns
 * @param defaultValue
 * @returns {string}
 */
export function getValueForUrl(
  url: string,
  patterns: Record<string, string>,
  defaultValue: string
): string {
  // /index -> /
  const urlWithoutIndex = url.replace(/\/index$/, '/')
  const sortedPatterns = Object.entries(patterns).sort((a, b) => b[0].length - a[0].length)

  for (const [pattern, value] of sortedPatterns) {
    if (new RegExp(`^${pattern.replace(/\*/g, '.*')}$`).test(urlWithoutIndex)) {
      return value
    }
  }

  return defaultValue
}

export default sitemap
