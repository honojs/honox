# HonoX

**HonoX** is a simple and fast meta-framework for creating full-stack websites or Web APIs - (formerly _[Sonik](https://github.com/sonikjs/sonik)_). It stands on the shoulders of giants; built on [Hono](https://hono.dev/), [Vite](https://vitejs.dev/), and UI libraries.

**Note**: _HonoX is currently in the "alpha stage". Breaking changes are introduced without following semantic versioning._

## Features

- **File-based routing** - You can create a large application like Next.js.
- **Fast SSR** - Rendering is ultra-fast thanks to Hono.
- **BYOR** - You can bring your own renderer, not only one using hono/jsx.
- **Islands hydration** - If you want interactions, create an island. JavaScript is hydrated only for it.
- **Middleware** - It works as Hono, so you can use a lot of Hono's middleware.

## Installing

You can install the `honox` package from the npm.

```txt
npm install hono honox
```

## Starter template

If you are starting a new HonoX project, use the `hono-create` command. Run the following and choose `x-basic` (use the arrow keys to find the option).

```txt
npm create hono@latest
```

## Get Started - Basic

Let's create a basic HonoX application using hono/jsx as a renderer. This application has no client JavaScript and renders JSX on the server side.

### Project Structure

Below is a typical project structure for a HonoX application.

```txt
.
├── app
│   ├── global.d.ts // global type definitions
│   ├── routes
│   │   ├── _404.tsx // not found page
│   │   ├── _error.tsx // error page
│   │   ├── _renderer.tsx // renderer definition
│   │   ├── about
│   │   │   └── [name].tsx // matches `/about/:name`
│   │   └── index.tsx // matches `/`
│   └── server.ts // server entry file
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### `vite.config.ts`

The minimum Vite setup for development is as follows:

```ts
import { defineConfig } from 'vite'
import honox from 'honox/vite'

export default defineConfig({
  plugins: [honox()],
})
```

### Server Entry File

A server entry file is required. The file should be placed at `app/server.ts`. This file is first called by the Vite during the development or build phase.

In the entry file, simply initialize your app using the `createApp()` function. `app` will be an instance of Hono, so you can use Hono's middleware and the `showRoutes()` in `hono/dev`.

```ts
// app/server.ts
import { createApp } from 'honox/server'
import { showRoutes } from 'hono/dev'

const app = createApp()

showRoutes(app)

export default app
```

### Routes

There are three ways to define routes.

#### 1. `createRoute()`

Each route should return an array of `Handler | MiddlewareHandler`. `createRoute()` is a helper function to return it. You can write a route for a GET request with `default export`.

```tsx
// app/routes/index.tsx
// `createRoute()` helps you create handlers
import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div>
      <h1>Hello!</h1>
    </div>
  )
})
```

You can also handle methods other than GET by `export` `POST`, `PUT`, and `DELETE`.

```tsx
// app/routes/index.tsx
import { createRoute } from 'honox/factory'
import { getCookie, setCookie } from 'hono/cookie'

export const POST = createRoute(async (c) => {
  const { name } = await c.req.parseBody<{ name: string }>()
  setCookie(c, 'name', name)
  return c.redirect('/')
})

export default createRoute((c) => {
  const name = getCookie(c, 'name') ?? 'no name'
  return c.render(
    <div>
      <h1>Hello, {name}!</h1>
      <form method='POST'>
        <input type='text' name='name' placeholder='name' />
        <input type='submit' />
      </form>
    </div>
  )
})
```

#### 2. Using a Hono instance

You can create API endpoints by exporting an instance of the Hono object.

```ts
// app/routes/about/index.ts
import { Hono } from 'hono'

const app = new Hono()

// matches `/about/:name`
app.get('/:name', (c) => {
  const name = c.req.param('name')
  return c.json({
    'your name is': name,
  })
})

export default app
```

#### 3. Just return JSX

Or simply, you can just return JSX.

```tsx
// app/routes/index.tsx
export default function Home(_c: Context) {
  return <h1>Welcome!</h1>
}
```

### Renderer

Define your renderer - the middleware that does `c.setRender()` - by writing it in `_renderer.tsx`.

Before writing `_renderer.tsx`, write the Renderer type definition in `global.d.ts`.

```ts
// app/global.d.ts
import type {} from 'hono'

type Head = {
  title?: string
}

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, head?: Head): Response | Promise<Response>
  }
}
```

The JSX Renderer middleware allows you to create a Renderer as follows:

```tsx
// app/routes/_renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {title ? <title>{title}</title> : <></>}
      </head>
      <body>{children}</body>
    </html>
  )
})
```

The `_renderer.tsx` is applied under each directory, and the `app/routes/posts/_renderer.tsx` is applied in `app/routes/posts/*`.

### Not Found page

You can write a custom Not Found page in `_404.tsx`.

```tsx
// app/routes/_404.tsx
import { NotFoundHandler } from 'hono'

const handler: NotFoundHandler = (c) => {
  return c.render(<h1>Sorry, Not Found...</h1>)
}

export default handler
```

### Error Page

You can write a custom Error page in `_error.tsx`.

```tsx
// app/routes/_error.tsx
import { ErrorHandler } from 'hono'

const handler: ErrorHandler = (e, c) => {
  return c.render(<h1>Error! {e.message}</h1>)
}

export default handler
```

## Get Started - with Client

Let's create an application that includes a client side. Here, we will use hono/jsx/dom.

### Project Structure

Below is the project structure of a minimal application including a client side:

```txt
.
├── app
│   ├── client.ts // client entry file
│   ├── global.d.ts
│   ├── islands
│   │   └── counter.tsx // island component
│   ├── routes
│   │   ├── _renderer.tsx
│   │   └── index.tsx
│   └── server.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Renderer

This is a `_renderer.tsx`, which will load the `/app/client.ts` entry file for the client. It will load the JavaScript file for production according to the variable `import.meta.env.PROD`. And renders the inside of `<HasIslands />` if there are islands on that page.

```tsx
// app/routes/_renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'
import { HasIslands } from 'honox/server'

export default jsxRenderer(({ children }) => {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {import.meta.env.PROD ? (
          <HasIslands>
            <script type='module' src='/static/client.js'></script>
          </HasIslands>
        ) : (
          <script type='module' src='/app/client.ts'></script>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
})
```

If you have a manifest file in `dist/.vite/manifest.json`, you can easily write it using `<Script />`.

```tsx
// app/routes/_renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from 'honox/server'

export default jsxRenderer(({ children }) => {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <Script src='/app/client.ts' />
      </head>
      <body>{children}</body>
    </html>
  )
})
```

**Note**: Since `<HasIslands />` can slightly affect build performance when used, it is recommended that you do not use it in the development environment, but only at build time. `<Script />` does not cause performance degradation during development, so it's better to use it.

#### nonce Attribute

If you want to add a `nonce` attribute to `<Script />` or `<script />` element, you can use [Security Headers Middleware](https://hono.dev/middleware/builtin/secure-headers).

Define the middleware:

```ts
// app/routes/_middleware.ts
import { createRoute } from 'honox/factory'
import { secureHeaders, NONCE } from 'hono/secure-headers'

export default createRoute(
  secureHeaders({
    contentSecurityPolicy: {
      scriptSrc: [NONCE],
    },
  })
)
```

You can get the `nonce` value with `c.get('secureHeadersNonce')`:

```tsx
// app/routes/_renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from 'honox/server'

export default jsxRenderer(({ children }, c) => {
  return (
    <html lang='en'>
      <head>
        <Script src='/app/client.ts' async nonce={c.get('secureHeadersNonce')} />
      </head>
      <body>{children}</body>
    </html>
  )
})
```

### Client Entry File

A client-side entry file should be in `app/client.ts`. Simply, write `createClient()`.

```ts
// app/client.ts
import { createClient } from 'honox/client'

createClient()
```

### Interactions

If you want to add interactions to your page, create Island components. Islands components should be:

- Placed under `app/islands` directory or named with `$` prefix like `$componentName.tsx`.
- It should be exported as a `default` or a proper component name that uses camel case but does not contain `_` and is not all uppercase.

For example, you can write an interactive component such as the following counter:

```tsx
// app/islands/counter.tsx
import { useState } from 'hono/jsx'

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

When you load the component in a route file, it is rendered as Server-Side rendering and JavaScript is also sent to the client side.

```tsx
// app/routes/index.tsx
import { createRoute } from 'honox/factory'
import Counter from '../islands/counter'

export default createRoute((c) => {
  return c.render(
    <div>
      <h1>Hello</h1>
      <Counter />
    </div>
  )
})
```

**Note**: You cannot access a Context object in Island components. Therefore, you should pass the value from components outside of the Island.

```ts
import { useRequestContext } from 'hono/jsx-renderer'
import Counter from '../islands/counter.tsx'

export default function Component() {
  const c = useRequestContext()
  return <Counter init={parseInt(c.req.query('count') ?? '0', 10)} />
}
```

## BYOR - Bring Your Own Renderer

You can bring your own renderer using a UI library like React, Preact, Solid, or others.

**Note**: We may not provide support for the renderer you bring.

### React case

You can define a renderer using [`@hono/react-renderer`](https://github.com/honojs/middleware/tree/main/packages/react-renderer). Install the modules first.

```txt
npm i @hono/react-renderer react react-dom hono
npm i -D @types/react @types/react-dom
```

Define the Props that the renderer will receive in `global.d.ts`.

```ts
// global.d.ts
import '@hono/react-renderer'

declare module '@hono/react-renderer' {
  interface Props {
    title?: string
  }
}
```

The following is an example of `app/routes/_renderer.tsx`.

```tsx
// app/routes/_renderer.tsx
import { reactRenderer } from '@hono/react-renderer'

export default reactRenderer(({ children, title }) => {
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {import.meta.env.PROD ? (
          <script type='module' src='/static/client.js'></script>
        ) : (
          <script type='module' src='/app/client.ts'></script>
        )}
        {title ? <title>{title}</title> : ''}
      </head>
      <body>{children}</body>
    </html>
  )
})
```

The `app/client.ts` will be like this.

```ts
// app/client.ts
import { createClient } from 'honox/client'

createClient({
  hydrate: async (elem, root) => {
    const { hydrateRoot } = await import('react-dom/client')
    hydrateRoot(root, elem)
  },
  createElement: async (type: any, props: any) => {
    const { createElement } = await import('react')
    return createElement(type, props)
  },
})
```

Configure react in `vite.config.ts`.

```ts
// vite.config.ts
import build from '@hono/vite-build/cloudflare-pages'
import honox from 'honox/vite'
import { defineConfig } from 'vite'

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
      },
    }
  } else {
    return {
      ssr: {
        external: ['react', 'react-dom'],
      },
      plugins: [honox(), build()],
    }
  }
})
```

Adjust `tsconfig.json` jsx factory function option.

```ts
// tsconfig.json
{
  "compilerOptions": {
    ...
    "jsxImportSource": "react"
    ...
  }
}

```

## Guides

### Nested Layouts

If you are using the JSX Renderer middleware, you can nest layouts using ` <Layout />`.

```tsx
// app/routes/posts/_renderer.tsx

import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, Layout }) => {
  return (
    <Layout>
      <nav>Posts Menu</nav>
      <div>{children}</div>
    </Layout>
  )
})
```

#### Passing Additional Props in Nested Layouts

Props passed to nested renderers do not automatically propagate to the parent renderers. To ensure that the parent layouts receive the necessary props, you should explicitly pass them from the nested <Layout /> component. Here's how you can achieve that:

Let's start with our route handler:

```tsx
// app/routes/nested/index.tsx
export default createRoute((c) => {
  return c.render(<div>Content</div>, { title: 'Dashboard' })
})
```

Now, let's take a look at our nested renderer:

```tsx
// app/routes/nested/_renderer.tsx
export default jsxRenderer(({ children, Layout, title }) => {
  return (
    <Layout title={title}>
      {/* Pass the title prop to the parent renderer */}
      <main>{children}</main>
    </Layout>
  )
})
```

In this setup, all the props sent to the nested renderer's <Layout /> are consumed by the parent renderer:

```tsx
// app/routes/_renderer.tsx
export default jsxRenderer(({ children, title }) => {
  return (
    <html lang='en'>
      <head>
        <title>{title}</title> {/* Use the title prop here */}
      </head>
      <body>
        {children} {/* Insert the Layout's children here */}
      </body>
    </html>
  )
})
```

### Using Middleware

You can use Hono's Middleware in each root file with the same syntax as Hono. For example, to validate a value with the [Zod Validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator), do the following:

```tsx
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const schema = z.object({
  name: z.string().max(10),
})

export const POST = createRoute(zValidator('form', schema), async (c) => {
  const { name } = c.req.valid('form')
  setCookie(c, 'name', name)
  return c.redirect('/')
})
```

Alternatively, you can use a `_middleware.(ts|tsx)` file in a directory to have that middleware applied to the current route, as well as all child routes. Middleware is run in the order that it is listed within the array.

```ts
// /app/routes/_middleware.ts
import { createRoute } from 'honox/factory'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

export default createRoute(logger(), secureHeaders(), ...<more-middleware>)
```

### Trailing Slash

By default, trailing slashes are removed if the root file is an index file such as `index.tsx` or `index.mdx`.
However, if you set the `trailingSlash` option to `true` as the following, the trailing slash is not removed.

```ts
import { createApp } from 'honox/server'

const app = createApp({
  trailingSlash: true,
})
```

Like the followings:

- `trailingSlash` is `false` (default): `app/routes/path/index.mdx` => `/path`
- `trailingSlash` is `true`: `app/routes/path/index.mdx` => `/path/`

### Using Tailwind CSS

Given that HonoX is Vite-centric, if you wish to utilize [Tailwind CSS](https://tailwindcss.com/), basically adhere to [the official instructions](https://tailwindcss.com/docs/installation/using-vite).

Write `app/style.css`, you must set the base path for source detection explicitly:

```css
@import 'tailwindcss' source('../app');
```

Import it in a renderer file. Using the `Link` component will refer to the correct CSS file path after it is built.

```tsx
// app/routes/_renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'
import { Link } from 'honox/server'

export default jsxRenderer(({ children }) => {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <Link href='/app/style.css' rel='stylesheet' />
      </head>
      <body>{children}</body>
    </html>
  )
})
```

Finally, add `vite.config.ts` configuration to output assets for the production.

```ts
import honox from 'honox/vite'
import { defineConfig } from 'vite'
import build from '@hono/vite-build/cloudflare-pages'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    honox({
      client: {
        input: ['/app/style.css'],
      },
    }),
    build(),
    tailwindcss(),
  ],
})
```

### MDX

MDX can also be used. Here is the `vite.config.ts`.

```ts
import devServer from '@hono/vite-dev-server'
import mdx from '@mdx-js/rollup'
import honox from 'honox/vite'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'

export default defineConfig(() => {
  return {
    plugins: [
      honox(),
      mdx({
        jsxImportSource: 'hono/jsx',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
    ],
  }
})
```

Blog site can be created.

```tsx
// app/routes/index.tsx
import type { Meta } from '../types'

export default function Top() {
  const posts = import.meta.glob<{ frontmatter: Meta }>('./posts/*.mdx', {
    eager: true,
  })
  return (
    <div>
      <h2>Posts</h2>
      <ul class='article-list'>
        {Object.entries(posts).map(([id, module]) => {
          if (module.frontmatter) {
            return (
              <li>
                <a href={`${id.replace(/\.mdx$/, '')}`}>{module.frontmatter.title}</a>
              </li>
            )
          }
        })}
      </ul>
    </div>
  )
}
```

### Cloudflare Bindings

If you want to use Cloudflare's Bindings in your development environment, create `wrangler.toml` and configure it properly.

```toml
name = "my-project-name"
compatibility_date = "2024-04-01"
compatibility_flags = [ "nodejs_compat" ]
pages_build_output_dir = "./dist"

# [vars]
# MY_VARIABLE = "production_value"

# [[kv_namespaces]]
# binding = "MY_KV_NAMESPACE"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

In `vite.config.ts`, use the Cloudflare Adapter in `@hono/vite-dev-server`.

```ts
import honox from 'honox/vite'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    honox({
      devServer: {
        adapter,
      },
    }),
  ],
})
```

## Deployment

Since a HonoX instance is essentially a Hono instance, it can be deployed on any platform that Hono supports.

### Cloudflare Pages

Add the `wrangler.toml`:

```toml
# wrangler.toml
name = "my-project-name"
compatibility_date = "2024-04-01"
compatibility_flags = [ "nodejs_compat" ]
pages_build_output_dir = "./dist"
```

Setup the `vite.config.ts`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import honox from 'honox/vite'
import build from '@hono/vite-build/cloudflare-pages'

export default defineConfig({
  plugins: [honox(), build()],
})
```

Build command (including a client):

```txt
vite build --mode client && vite build
```

Deploy with the following commands after the build. Ensure you have [Wrangler](https://developers.cloudflare.com/workers/wrangler/) installed:

```txt
wrangler pages deploy
```

### SSG - Static Site Generation

Using Hono's SSG feature, you can generate static HTML for each route.

```ts
import { defineConfig } from 'vite'
import honox from 'honox/vite'
import ssg from '@hono/vite-ssg'

const entry = './app/server.ts'

export default defineConfig(() => {
  return {
    plugins: [honox(), ssg({ entry })],
  }
})
```

If you want to include client-side scripts and assets:

```ts
// vite.config.ts
import ssg from '@hono/vite-ssg'
import honox from 'honox/vite'
import client from 'honox/vite/client'
import { defineConfig } from 'vite'

const entry = './app/server.ts'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [client()],
    }
  } else {
    return {
      build: {
        emptyOutDir: false,
      },
      plugins: [honox(), ssg({ entry })],
    }
  }
})
```

Build command (including a client):

```txt
vite build --mode client && vite build
```

You can also deploy it to Cloudflare Pages.

```txt
wrangler pages deploy ./dist
```

### Others

Using `@hono/vite-build`, you can build the HonoX app for various platforms. For example, you can make it for the Bun:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import honox from 'honox/vite'
import build from '@hono/vite-build/bun'

export default defineConfig({
  plugins: [honox(), build()],
})
```

## Examples

- https://github.com/yusukebe/honox-examples

## Related projects

- [Hono](https://hono.dev/)
- [Vite](https://vitejs.dev/)

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
