import { resolve } from 'path'
import * as fs from 'fs'
import honoSitemapPlugin, {
  getFrequency,
  getPriority,
  getValueForUrl,
  isFilePathMatch,
  processRoutes,
  validateOptions,
} from './sitemap'

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
}))

describe('honoSitemapPlugin', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should create a plugin with default options', () => {
    const plugin = honoSitemapPlugin()
    expect(plugin.name).toBe('vite-plugin-hono-sitemap')
    expect(plugin.apply).toBe('build')
  })

  it('should transform matching files', () => {
    const plugin = honoSitemapPlugin()
    // @ts-expect-error transform is private
    const result = plugin.transform('', '/app/routes/index.tsx')
    expect(result).toEqual({ code: '', map: null })
  })

  it('should generate sitemap on buildEnd', () => {
    const plugin = honoSitemapPlugin({ hostname: 'https://example.com' })
    // @ts-expect-error transform is private
    plugin.transform('', '/app/routes/index.tsx')
    // @ts-expect-error transform is private
    plugin.transform('', '/app/routes/about.tsx')
    // @ts-expect-error buildEnd is private
    plugin.buildEnd()

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      resolve(process.cwd(), 'dist', 'sitemap.xml'),
      expect.stringContaining('<loc>https://example.com/</loc>')
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      resolve(process.cwd(), 'dist', 'sitemap.xml'),
      expect.stringContaining('<loc>https://example.com/about/</loc>')
    )
  })
})

describe('isFilePathMatch', () => {
  it('should match valid file paths', () => {
    expect(isFilePathMatch('/Users/abc/repo/app/routes/index.tsx', [])).toBe(true)
    expect(isFilePathMatch('/Users/abc/repo/app/routes/about/index.tsx', [])).toBe(true)
    expect(isFilePathMatch('/Users/abc/repo/app/routes/.well-known/security.txt.tsx', [])).toBe(
      true
    )
  })

  it('should not match invalid file paths', () => {
    expect(isFilePathMatch('/Users/abc/repo/app/routes/$id.tsx', [])).toBe(false)
    expect(isFilePathMatch('/Users/abc/repo/app/routes/test.spec.tsx', [])).toBe(false)
    expect(isFilePathMatch('/Users/abc/repo/app/routes/_middleware.tsx', [])).toBe(false)
  })

  it('should exclude specified paths', () => {
    expect(isFilePathMatch('/Users/abc/repo/app/routes/admin/index.tsx', ['/admin'])).toBe(false)
  })
})

describe('validateOptions', () => {
  it('should throw error for invalid hostname', () => {
    expect(() => validateOptions({ hostname: 'example.com' })).toThrow()
  })

  it('should throw error for invalid priority', () => {
    expect(() => validateOptions({ priority: { '/': '1.5' } })).toThrow()
  })

  it('should throw error for invalid frequency', () => {
    expect(() => validateOptions({ frequency: { '/': 'biweekly' as any } })).toThrow()
  })
})

describe('processRoutes', () => {
  it('should process routes correctly', () => {
    const files = ['/app/routes/index.tsx', '/app/routes/about.tsx']
    const result = processRoutes(files, 'https://example.com', '/app/routes', {}, {})
    expect(result).toHaveLength(2)
    expect(result[0].url).toBe('https://example.com')
    expect(result[1].url).toBe('https://example.com/about')
  })
})

describe('getFrequency', () => {
  it('should return correct frequency', () => {
    expect(getFrequency('/', { '/': 'daily' })).toBe('daily')
    expect(getFrequency('/about', { '/about': 'monthly' })).toBe('monthly')
    expect(getFrequency('/unknown', {})).toBe('weekly')
  })
})

describe('getPriority', () => {
  it('should return correct priority', () => {
    expect(getPriority('/', { '/': '1.0' })).toBe('1.0')
    expect(getPriority('/about', { '/about': '0.8' })).toBe('0.8')
    expect(getPriority('/unknown', {})).toBe('0.5')
  })
})

describe('getValueForUrl', () => {
  it('should return correct value for URL patterns', () => {
    const patterns = {
      '/': 'home',
      '/blog/*': 'blog',
      '/about': 'about',
    }
    expect(getValueForUrl('/', patterns, 'default')).toBe('home')
    expect(getValueForUrl('/blog/post-1', patterns, 'default')).toBe('blog')
    expect(getValueForUrl('/contact', patterns, 'default')).toBe('default')
  })
})
