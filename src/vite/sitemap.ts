import type { Hono } from 'hono'
import { inspectRoutes } from 'hono/dev'
import type { StatusCode } from 'hono/utils/http-status'

interface RouteData {
  path: string
  method: string
  name: string
  isMiddleware: boolean
}

export interface SitemapOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: Hono<any, any, string>
  hostname?: string
  exclude?: string[]
  frequency?: Record<string, Frequency>
  priority?: Record<string, string>
}

interface SitemapResponse {
  data: string
  status: StatusCode
  headers: Record<string, string>
}
type Frequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

const DEFAULT_CONFIG = {
  hostname: 'http://localhost:5173',
  exclude: ['/sitemap.xml'],
  defaultFrequency: 'weekly' as Frequency,
  defaultPriority: '0.5',
}

/**
 * Generates a sitemap for the given Hono app.
 * @param options - The options for generating the sitemap.
 * @param options.app - The Hono app to generate the sitemap for.
 * @param options.hostname - The hostname to use in the sitemap. Defaults to 'http://localhost:5173'.
 * @param options.exclude - An array of paths to exclude from the sitemap. Defaults to ['/sitemap.xml'].
 * @param options.frequency - An object mapping paths to their change frequency. Defaults to 'weekly'.
 * @param options.priority - An object mapping paths to their priority. Defaults to '0.5'.
 * @returns A promise that resolves to a SitemapResponse.
 * @throws Error if options are invalid.
 * @example
 * ```ts
 * // app/routes/sitemap.xml.ts
 * import { Hono } from 'hono'
 * import { sitemap } from 'hono/vite/sitemap'
 * import app from '../server'
 *
 * const route = new Hono()
 *
 * route.get('/', async c => {
 *   const { data , status, headers } = await sitemap({
 *     app,
 *     hostname: 'https://example.com',
 *     exclude: ['/hidden'],
 *     priority: {'/': '1.0', '/posts/*': '0.6'},
 *     frequency: {'/': 'daily', '/posts/*': 'weekly'},
 *   })
 *   return c.body(
 *     data,
 *     status,
 *     headers
 *   )
 * })
 *
 * export default route
 * ```
 */
const sitemap = async (options: SitemapOptions): Promise<SitemapResponse> => {
  try {
    validateOptions(options)

    const config = { ...DEFAULT_CONFIG, ...options }
    const routesData: RouteData[] = inspectRoutes(config.app)

    const filteredRoutes = sortRoutesByDepth(routesData).filter(
      (route) =>
        !config.exclude.includes(route.path) &&
        route.method === 'GET' &&
        !route.isMiddleware &&
        route.path !== '/*'
    )

    const sitemapXml = await generateSitemapXml(filteredRoutes, config)

    return {
      data: sitemapXml,
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    throw error
  }
}

/**
 * Validates the provided options.
 * @param options - The options to validate.
 * @throws Error if options are invalid.
 */
const validateOptions = (options: SitemapOptions): void => {
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
 * Sorts routes by the depth of their paths.
 * @param routes - The routes to sort.
 * @returns Sorted array of routes.
 */
const sortRoutesByDepth = (routes: RouteData[]): RouteData[] => {
  return routes.sort((a, b) => {
    const aDepth = a.path === '/' ? 0 : a.path.split('/').length
    const bDepth = b.path === '/' ? 0 : b.path.split('/').length
    return aDepth - bDepth
  })
}

/**
 * Generates the XML content for the sitemap.
 * @param routes - The filtered routes.
 * @param config - The configuration options.
 * @returns A promise that resolves to the XML string.
 */
const generateSitemapXml = async (
  routes: RouteData[],
  config: SitemapOptions & typeof DEFAULT_CONFIG
): Promise<string> => {
  const lastMod = new Date().toISOString().split('T')[0]
  const getChangeFreq = (path: string) => config.frequency?.[path] || config.defaultFrequency
  const getPriority = (path: string) => config.priority?.[path] || config.defaultPriority

  const urlEntries = routes.map(
    (route) => `
    <url>
      <loc>${route.path === '/' ? config.hostname : `${config.hostname}${route.path}`}/</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>${getChangeFreq(route.path)}</changefreq>
      <priority>${getPriority(route.path)}</priority>
    </url>
  `
  )

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries.join('')}
  </urlset>`
}

export default sitemap
