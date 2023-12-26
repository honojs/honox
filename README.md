# HonoX

HonoX is a simple and fast meta framework for creating Web APIs and websites with Server-Side Rendering - (formerly _Sonik_). It stands on the shoulders of giants; built on [Hono](https://hono.dev/), [Vite](https://hono.dev/), and UI libraries.

**Note**: _HonoX is currently in a "beta stage". There will be breaking changes without any announcement. Don't use it in production. However, feel free to try it in your hobby project and give us your feedback!_

## Features

- **File-based routing** - Now, you can create a large app by separating concerns.
- **Fast SSR** - Supports only Server-Side Rendering. Rendering is ultra-fast thanks to Hono.
- **No JavaScript** - By default, there's no need for JavaScript. Nothing loads.
- **Any UI library** - You can use any UI library besides hono/jsx, such as React, Preact, etc.
- **Island hydration** - If you want interactions, create an island. JavaScript is hydrated only for that island.
- **Easy API creation** - You can create APIs using Hono's syntax.
- **Middleware** - It works just like Hono, so you can use many of Hono's middleware.

## Get Started - Basic

Let's create a basic HonoX application using hono/jsx as a renderer.

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

A server entry file is required. The file is should be placed at `app/server.ts`. This file is first called by the Vite during the development or build phase.

In the entry file, simply initialize your app using the `createApp()` function. app will be an instance of Hono, so you can utilize Hono's middleware and the `showRoutes()` in `hono/dev`.

```ts
// app/server.ts
import { createApp } from 'honox/server'
import { showRoutes } from 'hono/dev'

const app = createApp()

showRoutes(app)

export default app
```

### Routes

Each route should return an array of `Handler | MiddlewareHandler`. You can write a route for a GET request with `default export`.

```tsx
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

#### Using Hono instance

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

### Renderer

You can define Hono's Renderer - i.e. the middleware that does `c.setRender()` - by writing it in `_renderer.tsx`.

Before writing `_renderer.tsx`, write the Renderer type definition in `global.d.ts`.

```ts
// app/global.d.ts
import 'hono'

type Head = {
  title?: string
}

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, head?: Head): Response | Promise<Response>
  }
}
```

The JSX Renderer middleware allows you to define a Renderer as follows:

```tsx
// app/routes/_renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {title ? <title>{title}</title> : ''}
      </head>
      <body>{children}</body>
    </html>
  )
})
```

The `_renderer.tsx` is applied under each directory, and the `app/routes/posts/_renderer.tsx` is applied in `app/routes/posts/*`.

### Not Found page

You can write a custom Not Found page in `_404.tx`.

```tsx
// app/routes/_404.tsx
import { NotFoundHandler } from 'hono'

const handler: NotFoundHandler = (c) => {
  return c.render(<h1>Sorry, Not Found...</h1>)
}

export default handler
```

### Error Page

You can write a custom Error page in `_error.tx`.

```tsx
// app/routes/_error.ts
import { ErrorHandler } from 'hono'

const handler: ErrorHandler = (e, c) => {
  return c.render(<h1>Error! {e.message}</h1>)
}

export default handler
```

## Get Started - with Client

Let's create an application that includes a client side. Here, we will use React as the UI library.

### Project Structure

The below is the project structure of a minimal application including a client side:

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

### React Renderer

You can define a renderer using [`@hono/react-renderer`](https://github.com/honojs/middleware/tree/main/packages/react-renderer). Install the modules first.

```txt
npm i @hono/react-renderer react react-dom hono
npm i -D @types/react @types/react-dom
```

Next, define the Props that the renderer will receive in `global.d.ts`.

```ts
// global.d.ts
import '@hono/react-renderer'

declare module '@hono/react-renderer' {
  interface Props {
    title?: string
  }
}
```

Write `_renderer.tsx`, which will load the `/app/client.ts` entry file for the client. It also loads the JavaScript file for the production according to the variable `import.meta.env.PROD`.

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
          <>
            <script type='module' src='/static/client.js'></script>
          </>
        ) : (
          <>
            <script type='module' src='/app/client.ts'></script>
          </>
        )}
        {title ? <title>{title}</title> : ''}
      </head>
      <body>{children}</body>
    </html>
  )
})
```

### Client

A client side entry file should be in `app/client.ts`. You can specify each option in `createClient()` for each UI library.

```ts
// app/client.ts
import { createClient } from 'honox/client'

createClient({
  hydrate: async (elem, root) => {
    const { hydrateRoot } = await import('react-dom/client')
    hydrateRoot(root, elem)
  },
  createElement: async (type: any, props: any, ...children: any[]) => {
    const { createElement } = await import('react')
    return createElement(type, props, ...children)
  },
})
```

Function components placed in `app/islands/*` are also sent to the client side. For example, you can write interactive component such as the following counter:

```tsx
// app/islands/counter.tsx
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  const increment = () => setCount(count + 1)
  return (
    <div>
      <p>
        Count: <span>{count}</span>
      </p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}
```

When you load the component in a route file, it is rendered as Server-Side rendering and JavaScript is also delivered to the client-side.

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

## Guide

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

### Using Tailwind CSS

Given that HonoX is Vite-centric, if you wish to utilize [Tailwind CSS](https://tailwindcss.com/), simply adhere to the official instructions.

Prepare `tailwind.config.js` and `postcss.config.js`:

```js
// tailwind.config.js
export default {
  content: ['./app/**/*.tsx'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```js
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Write `app/style.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Finally, import it in a renderer file:

```tsx
// app/routes/_renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children }) => {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {import.meta.env.PROD ? (
          <>
            <link href='static/assets/style.css' rel='stylesheet' />
          </>
        ) : (
          <>
            <link href='/app/style.css' rel='stylesheet' />
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
})
```

## Deployment

Since a HonoX instance is essentially a Hono instance, it can be deployed on any platform that Hono supports.

### Cloudflare Pages

Setup the `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import honox from 'honox/vite'

export default defineConfig({
  build: {
    minify: true,
    rollupOptions: {
      output: {
        entryFileNames: '_worker.js',
      },
    },
  },
  plugins: [honox()],
})
```

If you want to include client side scripts and assets:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import honox from 'honox/vite'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: ['./app/style.css'],
          output: {
            entryFileNames: 'static/client.js',
            chunkFileNames: 'static/assets/[name]-[hash].js',
            assetFileNames: `static/assets/[name].[ext]`,
          },
        },
        emptyOutDir: false,
      },
    }
  } else {
    return {
      build: {
        minify: true,
        rollupOptions: {
          output: {
            entryFileNames: '_worker.js',
          },
        },
      },
      plugins: [honox()],
    }
  }
})
```

To serve static files for Cloudflare Pages, edit `app/server.ts`:

```ts
// app/server.ts
import { createApp } from 'honox/server'
import { serveStatic } from 'hono/cloudflare-pages'

const app = createApp({
  init: (app) => {
    app.get('/static/*', serveStatic())
  },
})

export default app
```

Build command (including a client):

```txt
vite build && vite build --mode client
```

Deploy with the following commands after build. Ensure you have [Wrangler](https://developers.cloudflare.com/workers/wrangler/) installed:

```txt
wrangler pages deploy ./dist
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
