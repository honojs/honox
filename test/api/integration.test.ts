import { poweredBy } from 'hono/powered-by'
import { createApp } from '../../src/server'

describe('Basic', () => {
  const ROUTES = import.meta.glob('./app/routes/**/[a-z[-][a-z[_-]*.ts', {
    eager: true,
  })

  const app = createApp({
    root: './app/routes',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ROUTES: ROUTES as any,
    init: (app) => {
      app.use('*', poweredBy())
    },
  })

  it('Should have correct routes', () => {
    const routes = [
      { path: '/*', method: 'ALL', handler: expect.anything() },
      {
        path: '/about/*',
        method: 'ALL',
        handler: expect.anything(),
      },

      {
        path: '/about/:name',
        method: 'GET',
        handler: expect.anything(),
      },
      {
        path: '/about/:name/address',
        method: 'GET',
        handler: expect.anything(),
      },
      {
        path: '/middleware/*',
        method: 'ALL',
        handler: expect.anything(),
      },
      {
        path: '/middleware/*',
        method: 'ALL',
        handler: expect.anything(),
      },
      {
        path: '/middleware',
        method: 'GET',
        handler: expect.anything(),
      },
      {
        path: '/middleware/foo',
        method: 'GET',
        handler: expect.anything(),
      },
      { path: '/*', method: 'ALL', handler: expect.anything() },
      { path: '/', method: 'GET', handler: expect.anything() },
      { path: '/foo', method: 'GET', handler: expect.anything() },
    ]

    expect(app.routes).toHaveLength(routes.length)
    expect(app.routes).toEqual(routes)
  })

  it('Should return 200 response - / with a Powered By header', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      path: '/',
    })
    expect(res.headers.get('x-powered-by')).toBe('Hono')
  })

  it('Should return 200 response - /foo', async () => {
    const res = await app.request('/foo')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      path: '/foo',
    })
  })

  it('Should return 404 response - /bar', async () => {
    const res = await app.request('/bar')
    expect(res.status).toBe(404)
  })

  it('Should return 200 response /about/me', async () => {
    const res = await app.request('/about/me')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      path: '/about/me',
    })
  })

  it('Should return 200 response /about/me/address', async () => {
    const res = await app.request('/about/me/address')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      path: '/about/me/address',
    })
  })

  it('Should return 200 with header values /middleware', async () => {
    const res = await app.request('/middleware')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-powered-by')).toBe('Hono')
    expect(await res.json()).toEqual({
      path: '/middleware',
    })
  })

  it('Should return 200 with header values /middleware/foo', async () => {
    const res = await app.request('/middleware/foo')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-powered-by')).toBe('Hono')
    expect(await res.json()).toEqual({
      path: '/middleware/foo',
    })
  })
})
