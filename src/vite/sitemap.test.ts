import type { SitemapOptions } from './sitemap'
import sitemap from './sitemap'
import { Hono } from 'hono'

// モックHonoアプリケーションを作成
const createMockApp = (routes: string[]) => {
  const app = new Hono()
  routes.forEach((route) => {
    app.get(route, () => new Response('OK'))
  })
  return app
}
describe('sitemap', () => {
  it('sitemap generator creates valid XML', async () => {
    const app = createMockApp(['/', '/about', '/contact'])
    const options: SitemapOptions = {
      app,
      hostname: 'https://example.com',
    }

    const result = await sitemap(options)

    expect(result.status).toBe(200)
    expect(result.headers['Content-Type']).toBe('application/xml')
    expect(result.data).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(result.data).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(result.data).toContain('<loc>https://example.com/</loc>')
    expect(result.data).toContain('<loc>https://example.com/about/</loc>')
    expect(result.data).toContain('<loc>https://example.com/contact/</loc>')
  })

  it('sitemap generator respects exclude option', async () => {
    const app = createMockApp(['/', '/about', '/contact', '/admin'])
    const options: SitemapOptions = {
      app,
      hostname: 'https://example.com',
      exclude: ['/admin'],
    }

    const result = await sitemap(options)

    expect(result.data).not.toContain('<loc>https://example.com/admin/</loc>')
  })

  it('sitemap generator uses custom frequency and priority', async () => {
    const app = createMockApp(['/', '/about'])
    const options: SitemapOptions = {
      app,
      hostname: 'https://example.com',
      frequency: {
        '/': 'daily',
      },
      priority: {
        '/': '1.0',
      },
    }

    const result = await sitemap(options)

    expect(result.data).toContain('<changefreq>daily</changefreq>')
    expect(result.data).toContain('<priority>1.0</priority>')
  })

  it('sitemap generator throws error for invalid priority', async () => {
    const app = createMockApp(['/', '/about'])
    const options: SitemapOptions = {
      app,
      hostname: 'https://example.com',
      priority: {
        '/': '2.0', // 無効な優先度
      },
    }

    await expect(sitemap(options)).rejects.toThrow('Invalid priority value')
  })

  it('sitemap generator throws error for invalid frequency', async () => {
    const app = createMockApp(['/', '/about'])
    const options: SitemapOptions = {
      app,
      hostname: 'https://example.com',
      frequency: {
        '/': 'annually' as never, // 無効な頻度
      },
    }

    await expect(sitemap(options)).rejects.toThrow('Invalid frequency value')
  })

  it('sitemap generator uses default values when not provided', async () => {
    const app = createMockApp(['/', '/about'])
    const options: SitemapOptions = {
      app,
    }

    const result = await sitemap(options)

    expect(result.data).toContain('<loc>http://localhost:5173/</loc>')
    expect(result.data).toContain('<changefreq>weekly</changefreq>')
    expect(result.data).toContain('<priority>0.5</priority>')
  })
})
