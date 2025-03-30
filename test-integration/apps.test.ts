/* eslint-disable @typescript-eslint/no-explicit-any */
import { poweredBy } from 'hono/powered-by'
import { createApp } from '../src/server'

describe('Basic', () => {
  const ROUTES = import.meta.glob('../mocks/app/routes/**/[a-z[-][a-z[_-]*.(tsx|ts|mdx)', {
    eager: true,
  })
  const NOT_FOUND = import.meta.glob('../mocks/app/routes/**/_404.(ts|tsx)', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app/routes',
    ROUTES: ROUTES as any,
    NOT_FOUND: NOT_FOUND as any,
    init: (app) => {
      app.use('*', poweredBy())
    },
  })

  it('Should have correct routes', () => {
    const routes: { path: string; method: string }[] = [
      {
        path: '/*',
        method: 'ALL',
      },
      {
        path: '/about/:name/address',
        method: 'GET',
      },
      {
        path: '/about/:name',
        method: 'GET',
      },
      {
        path: '/about/:name',
        method: 'POST',
      },
      {
        path: '/non-interactive',
        method: 'GET',
      },
      {
        path: '/interaction',
        method: 'GET',
      },
      {
        path: '/interaction/anywhere',
        method: 'GET',
      },
      {
        path: '/interaction/children',
        method: 'GET',
      },
      {
        path: '/interaction/error-boundary',
        method: 'GET',
      },
      {
        path: '/interaction/suspense-never',
        method: 'GET',
      },
      {
        path: '/interaction/suspense',
        method: 'GET',
      },
      {
        path: '/interaction/suspense-islands',
        method: 'GET',
      },
      {
        path: '/interaction/nested',
        method: 'GET',
      },
      {
        path: '/directory',
        method: 'GET',
      },
      {
        path: '/directory/throw_error',
        method: 'GET',
      },
      {
        path: '/directory/sub/throw_error',
        method: 'GET',
      },
      {
        path: '/fc',
        method: 'GET',
      },
      { path: '/api', method: 'POST' },
      { path: '/api', method: 'GET' },
      { path: '/', method: 'GET' },
      {
        path: '/post',
        method: 'GET',
      },
      {
        path: '/throw_error',
        method: 'GET',
      },
      {
        path: '/app/nested',
        method: 'GET',
      },
    ]
    expect(app.routes).toHaveLength(52)
    expect(app.routes).toEqual(
      expect.arrayContaining(
        routes.map(({ path, method }) => {
          return {
            path,
            method,
            handler: expect.any(Function),
          }
        })
      )
    )
  })

  it('Should return 200 response - / with a Powered By header', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<h1>Hello</h1>')
    expect(res.headers.get('x-powered-by'), 'Hono')
  })

  it('Should return 404 response - /foo', async () => {
    const res = await app.request('/foo')
    expect(res.status).toBe(404)
  })

  it('Should return custom 404 response - /not-found', async () => {
    const res = await app.request('/not-found')
    expect(res.status).toBe(404)
    expect(await res.text()).toBe('<h1>Not Found</h1>')
  })

  it('Should return 200 response - /about/me', async () => {
    const res = await app.request('/about/me')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe('<p>It&#39;s me</p><b>My name is me</b>')
  })

  it('Should return 200 response - POST /about/me', async () => {
    const res = await app.request('/about/me', {
      method: 'POST',
    })
    expect(res.status).toBe(201)
  })

  it('Should return 200 response - GET /fc', async () => {
    const res = await app.request('/fc')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<h1>Function from /fc</h1>')
  })

  it('Should not determined as an island component - GET /non-interactive', async () => {
    const res = await app.request('/non-interactive')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<p>Not Island</p>')
  })

  it('Should render MDX content - /post', async () => {
    const res = await app.request('/post')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<h1>Hello MDX</h1>')
  })

  it('Should return 500 response - /throw_error', async () => {
    global.console.trace = vi.fn()
    const res = await app.request('/throw_error')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe('Internal Server Error')
  })
})

describe('With preserved', () => {
  const ROUTES = import.meta.glob('../mocks/app/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)', {
    eager: true,
  })

  const RENDERER = import.meta.glob('../mocks/app/routes/**/_renderer.tsx', {
    eager: true,
  })

  const NOT_FOUND = import.meta.glob('../mocks/app/routes/_404.tsx', {
    eager: true,
  })

  const ERROR = import.meta.glob('../mocks/app/routes/**/_error.tsx', {
    eager: true,
  })

  const MIDDLEWARE = import.meta.glob('../mocks/app/routes/**/_middleware.(tsx|ts)', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app/routes',
    ROUTES: ROUTES as any,
    RENDERER: RENDERER as any,
    NOT_FOUND: NOT_FOUND as any,
    ERROR: ERROR as any,
    MIDDLEWARE: MIDDLEWARE as any,
  })

  it('Should return 200 response - /', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>This is a title</title></head><body><h1>Hello</h1></body></html>'
    )
  })

  it('Should return 404 response - /foo', async () => {
    const res = await app.request('/foo')
    expect(res.status).toBe(404)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Not Found</h1></body></html>'
    )
  })

  it('Should return 200 response - /about/me', async () => {
    const res = await app.request('/about/me')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>me</title></head><body><p>It&#39;s me</p><b>My name is me</b></body></html>'
    )
  })

  it('Should return 200 response - /about/me/address', async () => {
    const res = await app.request('/about/me/address')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-message')).toBe('from middleware')
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>me&#39;s address</title></head><body><h1>About</h1><div><b>me&#39;s address</b></div></body></html>'
    )
  })

  it('Should return 200 response - /about/me/hobbies/baseball', async () => {
    const res = await app.request('/about/me/hobbies/baseball')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-message')).toBe('from middleware')
    expect(res.headers.get('x-message-nested')).toBe('from nested middleware')
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title></title></head><body><h1>About</h1><div><p>me&#39;s hobby is baseball</p></div></body></html>'
    )
  })

  it('Should return 200 response - /interaction', async () => {
    const res = await app.request('/interaction')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title></title></head><body><honox-island component-name="/mocks/app/islands/Counter.tsx" data-serialized-props="{&quot;initial&quot;:5,&quot;id&quot;:&quot;first&quot;}"><div id="first"><p>Counter</p><p>Count: 5</p><button>Increment</button></div></honox-island><honox-island component-name="/mocks/app/islands/Counter.tsx" data-serialized-props="{&quot;initial&quot;:10}"><div id=""><p>Counter</p><p>Count: 10</p><button>Increment</button><div id=""><p>Counter</p><p>Count: 15</p><button>Increment</button></div></div><template data-hono-template="children"><honox-island component-name="/mocks/app/islands/Counter.tsx" data-serialized-props="{&quot;initial&quot;:15}"><div id=""><honox-island component-name="/mocks/app/islands/Badge.tsx" data-serialized-props="{&quot;name&quot;:&quot;Counter&quot;}"><p>Counter</p></honox-island><p>Count: 15</p><button>Increment</button></div></honox-island></template></honox-island><honox-island component-name="/mocks/app/islands/NamedCounter.tsx" component-export="NamedCounter" data-serialized-props="{&quot;initial&quot;:30,&quot;id&quot;:&quot;named&quot;}"><div id="named"><p>Counter</p><p>Count: 30</p><button>Increment</button></div></honox-island><honox-island component-name="/mocks/app/islands/Counter.tsx" data-serialized-props="{&quot;initial&quot;:20}"><div id=""><p>Counter</p><p>Count: 20</p><button>Increment</button><div id=""><p>Counter</p><p>Count: 30</p><button>Increment</button></div><div><div id="slot"><p>Counter</p><p>Count: 25</p><button>Increment</button></div></div></div><template data-hono-template="slot"><honox-island component-name="/mocks/app/islands/Counter.tsx" data-serialized-props="{&quot;id&quot;:&quot;slot&quot;,&quot;initial&quot;:25}"><div id="slot"><honox-island component-name="/mocks/app/islands/Badge.tsx" data-serialized-props="{&quot;name&quot;:&quot;Counter&quot;}"><p>Counter</p></honox-island><p>Count: 25</p><button>Increment</button></div></honox-island></template><template data-hono-template="children"><honox-island component-name="/mocks/app/islands/Counter.tsx" data-serialized-props="{&quot;initial&quot;:30}"><div id=""><honox-island component-name="/mocks/app/islands/Badge.tsx" data-serialized-props="{&quot;name&quot;:&quot;Counter&quot;}"><p>Counter</p></honox-island><p>Count: 30</p><button>Increment</button></div></honox-island></template></honox-island><script type="module" async="" src="/app/client.ts"></script></body></html>'
    )
  })

  it('Should return 200 response - /interaction/anywhere', async () => {
    const res = await app.request('/interaction/anywhere')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title></title></head><body><honox-island component-name="/mocks/app/components/$counter.tsx" data-serialized-props="{&quot;initial&quot;:5}"><div><p>Count: 5</p><button>Increment</button></div></honox-island><script type="module" async="" src="/app/client.ts"></script></body></html>'
    )
  })

  it('Should return 200 response - /interaction/nested', async () => {
    const res = await app.request('/interaction/nested')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      `
      <!DOCTYPE html>
      <html>
         <head>
            <title></title>
         </head>
         <body>
            <div>
               <h1>Nested Island Test</h1>
               <honox-island component-name="/mocks/app/islands/Counter.tsx" data-serialized-props="{}">
                  <div id="">
                     <p>Counter</p>
                     <p>Count: 0</p>
                     <button>Increment</button>
                  </div>
               </honox-island>
            </div>
            <script type="module" async="" src="/app/client.ts"></script>
         </body>
      </html>
`.replace(/\n|\s{2,}/g, '')
    )
  })

  it('Should return 200 response - /directory', async () => {
    const res = await app.request('/directory')
    expect(res.status).toBe(200)
    // hono/jsx escape a single quote to &#39;
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title></title></head><body><honox-island component-name="/mocks/app/routes/directory/_Counter.island.tsx" data-serialized-props="{&quot;id&quot;:&quot;under-score&quot;,&quot;initial&quot;:5}"><div id="under-score"><p>UnderScoreCount: 5</p><button>UnderScore Increment</button></div></honox-island><honox-island component-name="/mocks/app/routes/directory/$counter.tsx" data-serialized-props="{&quot;id&quot;:&quot;dollar&quot;,&quot;initial&quot;:5}"><div id="dollar"><p>DollarCount: 5</p><button>Dollar Increment</button></div></honox-island><script type="module" async="" src="/app/client.ts"></script></body></html>'
    )
  })

  it('Should return 500 response - /throw_error', async () => {
    const res = await app.request('/throw_error')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title>Internal Server Error</title></head><body><h1>Custom Error Message: Foo</h1></body></html>'
    )
  })

  it('Should return 500 response - /directory/throw_error', async () => {
    const res = await app.request('/directory/throw_error')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title></title></head><body><h1>Custom Error in /directory: Foo</h1></body></html>'
    )
  })

  it('Should return 500 response - /directory/sub/throw_error', async () => {
    const res = await app.request('/directory/sub/throw_error')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe(
      '<!DOCTYPE html><html><head><title></title></head><body><h1>Custom Error in /directory: Foo</h1></body></html>'
    )
  })
})

describe('API', () => {
  const ROUES = import.meta.glob('../mocks/app/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app/routes',
    ROUTES: ROUES as any,
  })

  it('Should return 200 response - /api', async () => {
    const res = await app.request('/api')
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Custom')).toBe('Hello')
    expect(await res.json()).toEqual({ foo: 'bar' })
  })

  it('Should return 200 response - POST /api', async () => {
    const res = await app.request('/api', {
      method: 'POST',
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      ok: true,
      message: 'created',
    })
  })
})

describe('Nested Layouts', () => {
  const ROUTES = import.meta.glob('../mocks/app-nested/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)', {
    eager: true,
  })

  const RENDERER = import.meta.glob('../mocks/app-nested/routes/**/_renderer.tsx', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app-nested/routes',
    ROUTES: ROUTES as any,
    RENDERER: RENDERER as any,
  })

  it('Should return 200 response - /nested', async () => {
    const res = await app.request('/nested')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<main><h1>Nested</h1></main>')
  })

  it('Should return 200 response - /nested/foo', async () => {
    const res = await app.request('/nested/foo')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<main><nav>foo menu</nav><h1>Foo</h1></main>')
  })

  it('Should return 200 response - /nested/foo/bar', async () => {
    const res = await app.request('/nested/foo/bar')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<main><nav>foo menu</nav><nav>bar menu</nav><h1>Bar</h1></main>')
  })

  it('Should return 200 response - /nested/foo/bar/baz', async () => {
    const res = await app.request('/nested/foo/bar/baz')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<main><nav>foo menu</nav><nav>bar menu</nav><h1>Baz</h1></main>')
  })
})

describe('Nested Middleware', () => {
  const ROUTES = import.meta.glob(
    '../mocks/app-nested-middleware/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)',
    {
      eager: true,
    }
  )

  const MIDDLEWARE = import.meta.glob(
    '../mocks/app-nested-middleware/routes/**/_middleware.(tsx|ts)',
    {
      eager: true,
    }
  )

  const app = createApp({
    root: '../mocks/app-nested-middleware/routes',
    ROUTES: ROUTES as any,
    MIDDLEWARE: MIDDLEWARE as any,
  })

  it('Should have "top" header - /', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(res.headers.get('top')).toEqual('top')
  })
  it('Should have "sub" header - /nested', async () => {
    const res = await app.request('/nested')
    expect(res.status).toBe(200)
    expect(res.headers.get('top')).toEqual('top')
    expect(res.headers.get('sub')).toEqual('sub')
  })
  it('Should have "foo" header and parent headers - /nested/foo', async () => {
    const res = await app.request('/nested/foo')
    expect(res.status).toBe(200)
    expect(res.headers.get('top')).toEqual('top')
    expect(res.headers.get('sub')).toEqual('sub')
    expect(res.headers.get('foo')).toEqual('foo')
  })
  it('Should have "bar" header and parent headers - /nested/foo/bar', async () => {
    const res = await app.request('/nested/foo/bar')
    expect(res.status).toBe(200)
    expect(res.headers.get('top')).toEqual('top')
    expect(res.headers.get('sub')).toEqual('sub')
    expect(res.headers.get('foo')).toEqual('foo')
    expect(res.headers.get('bar')).toEqual('bar')
  })
  it('Should have "baz" header and parent headers - /nested/foo/bar/baz', async () => {
    const res = await app.request('/nested/foo/bar/baz')
    expect(res.status).toBe(200)
    expect(res.headers.get('top')).toEqual('top')
    expect(res.headers.get('sub')).toEqual('sub')
    expect(res.headers.get('foo')).toEqual('foo')
    expect(res.headers.get('bar')).toEqual('bar')
    expect(res.headers.get('baz')).toEqual('baz')
  })
  it('Should have headers added by parent middleware - /nested/foo/bar/123', async () => {
    const res = await app.request('/nested/foo/bar/123')
    expect(res.status).toBe(200)
    expect(res.headers.get('top')).toEqual('top')
    expect(res.headers.get('sub')).toEqual('sub')
    expect(res.headers.get('foo')).toEqual('foo')
    expect(res.headers.get('bar')).toEqual('bar')
  })
})

describe('<Script /> component', () => {
  const ROUTES = import.meta.glob('../mocks/app-script/routes/**/index.tsx', {
    eager: true,
  })

  describe('default', () => {
    const RENDERER = import.meta.glob('../mocks/app-script/routes/**/_renderer.tsx', {
      eager: true,
    })

    const app = createApp({
      root: '../mocks/app-script/routes',
      ROUTES: ROUTES as any,
      RENDERER: RENDERER as any,
    })

    it('Should convert the script path correctly', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(
        '<html><head><script type="module" src="/static/client-abc.js"></script></head><body><main><honox-island component-name="/mocks/app-script/islands/Component.tsx" data-serialized-props="{}"><p>Component</p></honox-island></main></body></html>'
      )
    })

    it('Should convert the script path correctly - With `app = new Hono()` style', async () => {
      const res = await app.request('/classic')
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(
        '<html><head><script type="module" src="/static/client-abc.js"></script></head><body><main><honox-island component-name="/mocks/app-script/islands/Component.tsx" data-serialized-props="{}"><p>Component</p></honox-island></main></body></html>'
      )
    })

    describe('with base path - root relative', () => {
      const originalBaseURL = import.meta.env.BASE_URL

      beforeAll(() => {
        // this means `base: "/base/path/"` in vite.config.ts
        import.meta.env.BASE_URL = '/base/path/'
      })

      afterAll(() => {
        import.meta.env.BASE_URL = originalBaseURL
      })

      it('Should convert the script path correctly', async () => {
        const res = await app.request('/')
        expect(res.status).toBe(200)
        expect(await res.text()).toBe(
          '<html><head><script type="module" src="/base/path/static/client-abc.js"></script></head><body><main><honox-island component-name="/mocks/app-script/islands/Component.tsx" data-serialized-props="{}"><p>Component</p></honox-island></main></body></html>'
        )
      })
    })

    describe('with base path - root relative, without trailing slash', () => {
      const originalBaseURL = import.meta.env.BASE_URL

      beforeAll(() => {
        // this means `base: "/base/path"` in vite.config.ts
        import.meta.env.BASE_URL = '/base/path'
      })

      afterAll(() => {
        import.meta.env.BASE_URL = originalBaseURL
      })

      it('Should convert the script path correctly', async () => {
        const res = await app.request('/')
        expect(res.status).toBe(200)
        expect(await res.text()).toBe(
          '<html><head><script type="module" src="/base/path/static/client-abc.js"></script></head><body><main><honox-island component-name="/mocks/app-script/islands/Component.tsx" data-serialized-props="{}"><p>Component</p></honox-island></main></body></html>'
        )
      })
    })

    describe('with base path - absolute url', () => {
      const originalBaseURL = import.meta.env.BASE_URL

      beforeAll(() => {
        // this means `base: "https://example.com/base/path/"` in vite.config.ts
        import.meta.env.BASE_URL = 'https://example.com/base/path/'
      })

      afterAll(() => {
        import.meta.env.BASE_URL = originalBaseURL
      })

      it('Should convert the script path correctly', async () => {
        const res = await app.request('/')
        expect(res.status).toBe(200)
        expect(await res.text()).toBe(
          '<html><head><script type="module" src="https://example.com/base/path/static/client-abc.js"></script></head><body><main><honox-island component-name="/mocks/app-script/islands/Component.tsx" data-serialized-props="{}"><p>Component</p></honox-island></main></body></html>'
        )
      })
    })
  })

  describe('With async', () => {
    const RENDERER = import.meta.glob('../mocks/app-script/routes/**/_async_renderer.tsx', {
      eager: true,
    })

    const app = createApp({
      root: '../mocks/app-script/routes',
      ROUTES: ROUTES as any,
      RENDERER: RENDERER as any,
    })

    it('Should convert the script path correctly', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(
        '<html><body><main><honox-island component-name="/mocks/app-script/islands/Component.tsx" data-serialized-props="{}"><p>Component</p></honox-island></main><script type="module" async="" src="/static/client-abc.js"></script></body></html>'
      )
    })
  })

  describe('With nonce', () => {
    const RENDERER = import.meta.glob('../mocks/app-script/routes/**/_nonce_renderer.tsx', {
      eager: true,
    })

    const app = createApp({
      root: '../mocks/app-script/routes',
      ROUTES: ROUTES as any,
      RENDERER: RENDERER as any,
    })

    it('Should convert the script path correctly', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(
        '<html><body><main><honox-island component-name="/mocks/app-script/islands/Component.tsx" data-serialized-props="{}"><p>Component</p></honox-island></main><script type="module" src="/static/client-abc.js" nonce="hono"></script></body></html>'
      )
    })
  })
})

describe('<Link /> component', () => {
  const ROUTES = import.meta.glob('../mocks/app-link/routes/**/index.tsx', {
    eager: true,
  })

  describe('default (rel=stylesheet, absolute path)', () => {
    const RENDERER = import.meta.glob('../mocks/app-link/routes/**/_renderer.tsx', {
      eager: true,
    })

    const app = createApp({
      root: '../mocks/app-link/routes',
      ROUTES: ROUTES as any,
      RENDERER: RENDERER as any,
    })

    it('Should convert the link path correctly', async () => {
      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(await res.text()).toBe(
        '<html><head><link href="/static/globals-abc.css" rel="stylesheet"></link></head><body><main><div></div></main></body></html>'
      )
    })

    describe('with base path - root relative', () => {
      const originalBaseURL = import.meta.env.BASE_URL

      beforeAll(() => {
        // this means `base: "/base/path/"` in vite.config.ts
        import.meta.env.BASE_URL = '/base/path/'
      })

      afterAll(() => {
        import.meta.env.BASE_URL = originalBaseURL
      })

      it('Should convert the link path correctly', async () => {
        const res = await app.request('/')
        expect(res.status).toBe(200)
        expect(await res.text()).toBe(
          '<html><head><link href="/base/path/static/globals-abc.css" rel="stylesheet"></link></head><body><main><div></div></main></body></html>'
        )
      })
    })

    describe('with base path - root relative, without trailing slash', () => {
      const originalBaseURL = import.meta.env.BASE_URL

      beforeAll(() => {
        // this means `base: "/base/path"` in vite.config.ts
        import.meta.env.BASE_URL = '/base/path'
      })

      afterAll(() => {
        import.meta.env.BASE_URL = originalBaseURL
      })

      it('Should convert the link path correctly', async () => {
        const res = await app.request('/')
        expect(res.status).toBe(200)
        expect(await res.text()).toBe(
          '<html><head><link href="/base/path/static/globals-abc.css" rel="stylesheet"></link></head><body><main><div></div></main></body></html>'
        )
      })
    })

    describe('with base path - absolute url', () => {
      const originalBaseURL = import.meta.env.BASE_URL

      beforeAll(() => {
        // this means `base: "https://example.com/base/path/"` in vite.config.ts
        import.meta.env.BASE_URL = 'https://example.com/base/path/'
      })

      afterAll(() => {
        import.meta.env.BASE_URL = originalBaseURL
      })

      it('Should convert the link path correctly', async () => {
        const res = await app.request('/')
        expect(res.status).toBe(200)
        expect(await res.text()).toBe(
          '<html><head><link href="https://example.com/base/path/static/globals-abc.css" rel="stylesheet"></link></head><body><main><div></div></main></body></html>'
        )
      })
    })
  })
})

describe('<HasIslands /> Component with path aliases', () => {
  const ROUES = import.meta.glob('../mocks/app-alias/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)', {
    eager: true,
  })
  const RENDERER = import.meta.glob('../mocks/app-alias/routes/**/_renderer.tsx', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app-alias/routes',
    ROUTES: ROUES as any,
    RENDERER: RENDERER as any,
  })

  it('Should return a script tag with tagged HasIslands - /has-islands', async () => {
    const res = await app.request('/has-islands')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      '<html><body><honox-island component-name="/mocks/app-alias/islands/Counter.tsx" data-serialized-props="{}"><div>Counter</div></honox-island><script type="module" async="" src="/app/client.ts"></script></body></html>'
    )
  })

  it('Should no return a script tag - /has-no-islands', async () => {
    const res = await app.request('/has-no-islands')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<html><body><h1>No Islands</h1></body></html>')
  })
})

describe('<HasIslands /> Component with path alias with vite-tsconfig-paths', () => {
  const ROUES = import.meta.glob(
    '../mocks/app-alias-tsconfig-paths/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)',
    {
      eager: true,
    }
  )
  const RENDERER = import.meta.glob('../mocks/app-alias-tsconfig-paths/routes/**/_renderer.tsx', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app-alias-tsconfig-paths/routes',
    ROUTES: ROUES as any,
    RENDERER: RENDERER as any,
  })

  it('Should return a script tag with tagged HasIslands - /has-islands', async () => {
    const res = await app.request('/has-islands')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      '<html><body><honox-island component-name="/mocks/app-alias-tsconfig-paths/islands/Counter.tsx" data-serialized-props="{}"><div>Counter</div></honox-island><script type="module" async="" src="/app/client.ts"></script></body></html>'
    )
  })

  it('Should no return a script tag - /has-no-islands', async () => {
    const res = await app.request('/has-no-islands')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<html><body><h1>No Islands</h1></body></html>')
  })
})

describe('Island Components with Preserved Files', () => {
  const ROUTES = import.meta.glob(
    '../mocks/app-islands-in-preserved/routes/**/[a-z[-][a-z-_[]*.(tsx|ts|mdx)',
    {
      eager: true,
    }
  )
  const RENDERER = import.meta.glob('../mocks/app-islands-in-preserved/routes/**/_renderer.tsx', {
    eager: true,
  })
  const NOT_FOUND = import.meta.glob('../mocks/app-islands-in-preserved/routes/_404.tsx', {
    eager: true,
  })
  const ERROR = import.meta.glob('../mocks/app-islands-in-preserved/routes/_error.tsx', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app-islands-in-preserved/routes',
    ROUTES: ROUTES as any,
    RENDERER: RENDERER as any,
    NOT_FOUND: NOT_FOUND as any,
    ERROR: ERROR as any,
  })

  it('Ensures scripts are loaded for island components within preserved files on 404 routes', async () => {
    const res = await app.request('/foo')
    expect(res.status).toBe(404)
    expect(await res.text()).toBe(
      '<html><head><title>Not Found</title></head><body><honox-island component-name="/mocks/app-islands-in-preserved/islands/Counter.tsx" data-serialized-props="{}"><div id=""><p>Count: 0</p><button>Increment</button></div></honox-island><script type="module" async="" src="/app/client.ts"></script></body></html>'
    )
  })

  it('Ensures scripts are loaded for island components within preserved files on error routes', async () => {
    const res = await app.request('/throw_error')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe(
      '<html><head><title>Internal Server Error</title></head><body><honox-island component-name="/mocks/app-islands-in-preserved/islands/Counter.tsx" data-serialized-props="{}"><div id=""><p>Count: 0</p><button>Increment</button></div></honox-island><script type="module" async="" src="/app/client.ts"></script></body></html>'
    )
  })

  it('Ensures nested components, including MDX content and islands, load scripts correctly', async () => {
    const res = await app.request('/nested/post')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(
      '<html><head><title></title></head><body><honox-island component-name="/mocks/app-islands-in-preserved/islands/Counter.tsx" data-serialized-props="{}"><div id=""><p>Count: 0</p><button>Increment</button></div></honox-island><h1>Hello MDX</h1><script type="module" async="" src="/app/client.ts"></script></body></html>'
    )
  })
})

describe('Trailing Slash', () => {
  const ROUTES = import.meta.glob('../mocks/app-nested/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app-nested/routes',
    ROUTES: ROUTES as any,
    trailingSlash: true,
  })

  const paths = ['/nested', '/nested/foo', '/nested/foo/bar']
  for (const path of paths) {
    it(`Should return 404 response - ${path}`, async () => {
      const res = await app.request(path)
      expect(res.status).toBe(404)
    })
    it(`Should return 200 response - ${path}/`, async () => {
      const res = await app.request(`${path}/`)
      expect(res.status).toBe(200)
    })
  }

  it('Should return 200 response - /top', async () => {
    const res = await app.request('/top')
    expect(res.status).toBe(200)
  })
  it('Should return 404 response - /top/', async () => {
    const res = await app.request('/top/')
    expect(res.status).toBe(404)
  })
})

describe('Nested Dynamic Routes', () => {
  const ROUTES = import.meta.glob(
    '../mocks/app-nested-dynamic-routes/routes/**/[a-z[-][a-z-_[]*.(tsx|ts)',
    {
      eager: true,
    }
  )

  const app = createApp({
    root: '../mocks/app-nested-dynamic-routes/routes',
    ROUTES: ROUTES as any,
  })

  it('Should return 200 response - /resource', async () => {
    const res = await app.request('/resource')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<div>Resource Home</div>')
  })

  it('Should return 200 response - /resource/new', async () => {
    const res = await app.request('/resource/new')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<div>Create new resource</div>')
  })

  it('Should return 200 response - /resource/abcdef', async () => {
    const res = await app.request('/resource/abcdef')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<b>Resource Id abcdef</b>')
  })

  it('Should return 200 response - /resource/abcdef/resource2', async () => {
    const res = await app.request('/resource/abcdef/resource2')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<b>Resource2 Home</b>')
  })

  it('Should return 200 response - /resource/abcdef/resource2/new', async () => {
    const res = await app.request('/resource/abcdef/resource2/new')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<div>Create new resource 2</div>')
  })

  it('Should return 200 response - /resource/abcdef/resource2/12345', async () => {
    const res = await app.request('/resource/abcdef/resource2/12345')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<b>Resource2 Id abcdef / 12345</b>')
  })
})

describe('Function Component Response', () => {
  const ROUTES = import.meta.glob('../mocks/app-function/routes/**/[a-z[-][a-z[_-]*.(tsx|ts)', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app-function/routes',
    ROUTES: ROUTES as any,
  })

  it('Should handle direct Response return from function component', async () => {
    const res = await app.request('/api-response')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'API Response' })
  })

  it('Should handle JSX return from function component', async () => {
    const res = await app.request('/jsx-response')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<div>JSX Response</div>')
  })

  it('Should handle async function component with Response', async () => {
    const res = await app.request('/async-response')
    expect(res.status).toBe(201)
    expect(res.headers.get('x-custom')).toBe('async')
    expect(await res.json()).toEqual({ message: 'Async Response' })
  })

  it('Should handle async function component with JSX', async () => {
    const res = await app.request('/async-jsx')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<div>Async JSX Response</div>')
  })
})

describe('Route Groups', () => {
  const ROUTES = import.meta.glob('../mocks/app-route-groups/routes/**/[a-z[-][a-z[_-]*.(tsx|ts|mdx)', {
    eager: true,
  })
  const RENDERER = import.meta.glob('../mocks/app-route-groups/routes/**/_renderer.tsx', {
    eager: true,
  })
  const NOT_FOUND = import.meta.glob('../mocks/app-route-groups/routes/**/_404.(ts|tsx)', {
    eager: true,
  })

  const app = createApp({
    root: '../mocks/app-route-groups/routes',
    ROUTES: ROUTES as any,
    RENDERER: RENDERER as any,
    NOT_FOUND: NOT_FOUND as any,
    init: (app) => {
      app.use('*', poweredBy())
    },
  })

  it('Should have correct routes', () => {
    const routes: { path: string; method: string }[] = [
      {
        path: '/*',
        method: 'ALL',
      },
      {
        path: '/',
        method: 'GET',
      },
      {
        path: '/blog',
        method: 'GET',
      },
      {
        path: '/blog/hello-world',
        method: 'GET',
      },
    ]
    expect(app.routes).toHaveLength(12)
    expect(app.routes).toEqual(
      expect.arrayContaining(
        routes.map(({ path, method }) => {
          return {
            path,
            method,
            handler: expect.any(Function),
          }
        })
      )
    )
  })



  it('Should render /blog without (content) route group layout', async () => {
    const res = await app.request('/blog')
    expect(res.status).toBe(200)
      '<!DOCTYPE html><html><head><title></title></head><body><div>Here lies the blog posts</div></body></html>')
  })

  it('Should render /blog/hello-world MDX with (content) route group layout', async () => {
    const res = await app.request('/blog/hello-world')
    expect(res.status).toBe(200)
      '<!DOCTYPE html><html><head><title></title></head><body><div><h1>Blog</h1><p>Hello World</p></div></body></html>')
  })
})