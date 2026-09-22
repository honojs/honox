/** @jsxImportSource vue */
import { createMiddleware } from 'hono/factory'
import { createSSRApp, h } from 'vue'
import type { VNodeChild } from 'vue'
import { renderToString } from 'vue/server-renderer'

export default createMiddleware(async (c, next) => {
  c.setRenderer(((content: VNodeChild) =>
    renderToString(
      createSSRApp({
        render: () =>
          h('html', null, [
            h('body', null, [content, h('script', { type: 'module', src: '/client.ts' })]),
          ]),
      })
    ).then((html) => c.html(`<!DOCTYPE html>${html}`))) as never)
  await next()
})
