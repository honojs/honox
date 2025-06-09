/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hono } from 'hono'
import type { Env, ErrorHandler, MiddlewareHandler, NotFoundHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { H } from 'hono/types'
import { IMPORTING_ISLANDS_ID } from '../constants.js'
import { contextStorage } from './context-storage.js'
import {
  filePathToPath,
  groupByDirectory,
  listByDirectory,
  sortDirectoriesByDepth,
} from './utils/file.js'

const NOTFOUND_FILENAME = '_404.tsx'
const ERROR_FILENAME = '_error.tsx'
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'] as const

type HasIslandFile = {
  [key in typeof IMPORTING_ISLANDS_ID]?: boolean
}

type InnerMeta = {} & HasIslandFile

type AppFile = { default: Hono } & InnerMeta

type RouteFile = {
  default?: Function
} & { [M in (typeof METHODS)[number]]?: H[] } & InnerMeta

type RendererFile = { default: MiddlewareHandler } & InnerMeta
type NotFoundFile = { default: NotFoundHandler } & InnerMeta
type ErrorFile = { default: ErrorHandler } & InnerMeta
type MiddlewareFile = { default: MiddlewareHandler[] }

type InitFunction<E extends Env = Env> = (app: Hono<E>) => void

type BaseServerOptions<E extends Env = Env> = {
  ROUTES: Record<string, RouteFile | AppFile>
  RENDERER: Record<string, RendererFile>
  NOT_FOUND: Record<string, NotFoundFile>
  ERROR: Record<string, ErrorFile>
  MIDDLEWARE: Record<string, MiddlewareFile>
  root: string
  app?: Hono<E>
  init?: InitFunction<E>
  /**
   * Appends a trailing slash to URL if the route file is an index file, e.g., `index.tsx` or `index.mdx`.
   * @default false
   */
  trailingSlash?: boolean
}

export type ServerOptions<E extends Env = Env> = Partial<BaseServerOptions<E>>

type Variables = {} & HasIslandFile

export const createApp = <E extends Env>(options: BaseServerOptions<E>): Hono<E> => {
  const root = options.root
  const rootRegExp = new RegExp(`^${root}`)
  const getRootPath = (dir: string) => filePathToPath(dir.replace(rootRegExp, ''))

  const app = options.app ?? new Hono()
  const trailingSlash = options.trailingSlash ?? false

  // Track applied middleware to prevent duplication
  const appliedMiddleware = new Set<string>()

  // Share context by AsyncLocalStorage
  app.use(async function ShareContext(c, next) {
    await contextStorage.run(c, () => next())
  })

  if (options.init) {
    options.init(app)
  }

  // Not Found
  const NOT_FOUND_FILE = options.NOT_FOUND
  const notFoundMap = groupByDirectory(NOT_FOUND_FILE)

  // Error
  const ERROR_FILE = options.ERROR
  const errorMap = groupByDirectory(ERROR_FILE)

  // Renderer
  const RENDERER_FILE = options.RENDERER
  const rendererList = listByDirectory(RENDERER_FILE)

  // Middleware
  const MIDDLEWARE_FILE = options.MIDDLEWARE

  // Routes
  const ROUTES_FILE = options.ROUTES
  const routesMap = sortDirectoriesByDepth(groupByDirectory<RouteFile | AppFile>(ROUTES_FILE))

  const getPaths = (currentDirectory: string, fileList: Record<string, string[]>) => {
    let paths = fileList[currentDirectory] ?? []

    const getChildPaths = (childDirectories: string[]) => {
      paths = fileList[childDirectories.join('/')]
      if (!paths) {
        childDirectories.pop()
        if (childDirectories.length) {
          getChildPaths(childDirectories)
        }
      }
      return paths ?? []
    }

    const renderDirPaths = currentDirectory.split('/')
    paths = getChildPaths(renderDirPaths)
    paths.sort((a, b) => a.split('/').length - b.split('/').length)
    return paths
  }

  const errorHandlerMap: Record<string, ErrorHandler> = {}

  for (const map of routesMap) {
    for (const [dir, content] of Object.entries(map)) {
      const subApp = new Hono<{
        Variables: Variables
      }>()
      let hasIslandComponent = false

      const notFoundHandler = getNotFoundHandler(dir, notFoundMap)
      if (notFoundHandler) {
        subApp.use(async (c, next) => {
          await next()
          if (c.res.status === 404) {
            const notFoundResponse = await notFoundHandler(c)
            const res = new Response(notFoundResponse.body, {
              status: 404,
              headers: notFoundResponse.headers,
            })
            c.res = res
          }
        })
      }

      // Renderer
      const rendererPaths = getPaths(dir, rendererList)
      rendererPaths.map((path) => {
        const renderer = RENDERER_FILE[path]
        const importingIslands = renderer[IMPORTING_ISLANDS_ID]
        if (importingIslands) {
          hasIslandComponent = true
        }
        const rendererDefault = renderer.default
        if (rendererDefault) {
          subApp.all('*', rendererDefault)
        }
      })

      // Helper functions
      const escapeDir = (directory: string) =>
        directory
          .replaceAll('[', '\\[')
          .replaceAll(']', '\\]')
          .replaceAll('(', '\\(')
          .replaceAll(')', '\\)')

      const findMiddleware = (directory: string) =>
        Object.keys(MIDDLEWARE_FILE).find((x) =>
          new RegExp(escapeDir(directory) + '/_middleware.tsx?').test(x)
        )

      // Find middleware for current directory first
      let middlewareFile = findMiddleware(dir)

      // Issue 290 fix: Search parent directories if no middleware found
      if (!middlewareFile) {
        const dirParts = dir.split('/')
        for (let i = dirParts.length - 1; i >= 0; i--) {
          const parentDir = dirParts.slice(0, i).join('/')
          middlewareFile = findMiddleware(parentDir)
          if (middlewareFile) break
        }
      }

      if (middlewareFile) {
        const middleware = MIDDLEWARE_FILE[middlewareFile]
        const middlewareDir = middlewareFile
          .replace('/_middleware.tsx', '')
          .replace('/_middleware.ts', '')

        // Only apply if this directory should have this middleware
        const shouldApply =
          middlewareDir === dir ||
          (!appliedMiddleware.has(middlewareFile) && dir.startsWith(middlewareDir + '/'))

        if (middleware.default && shouldApply) {
          if (!appliedMiddleware.has(middlewareFile)) {
            appliedMiddleware.add(middlewareFile)
          }
          subApp.use(...middleware.default)
        }
      }

      for (const [filename, route] of Object.entries(content)) {
        const importingIslands = route[IMPORTING_ISLANDS_ID]
        const setInnerMeta = createMiddleware<{
          Variables: Variables
        }>(async function innerMeta(c, next) {
          c.set(IMPORTING_ISLANDS_ID, importingIslands ? true : hasIslandComponent)
          await next()
        })

        const routeDefault = route.default
        const path = filePathToPath(filename)

        // Instance of Hono
        if (routeDefault && 'fetch' in routeDefault) {
          subApp.use(setInnerMeta)
          subApp.route(path, routeDefault)
        }

        // export const POST = factory.createHandlers(...)
        for (const m of METHODS) {
          const handlers = (route as Record<string, H[]>)[m]
          if (handlers) {
            subApp.on(m, path, setInnerMeta)
            subApp.on(m, path, ...handlers)
          }
        }

        // export default factory.createHandlers(...)
        if (routeDefault && Array.isArray(routeDefault)) {
          subApp.get(path, setInnerMeta)
          subApp.get(path, ...(routeDefault as H[]))
        }

        // export default function Helle() {}
        if (typeof routeDefault === 'function') {
          subApp.get(path, setInnerMeta)
          subApp.get(path, async (c) => {
            const result = await routeDefault(c)

            if (result instanceof Response) {
              return result
            }

            return c.render(result, route as any)
          })
        }
      }

      // Get an error handler
      const errorHandler = getErrorHandler(dir, errorMap)
      if (errorHandler) {
        errorHandlerMap[dir] = errorHandler
      }

      // Apply an error handler
      for (const [path, errorHandler] of Object.entries(errorHandlerMap)) {
        const regExp = new RegExp(`^${path}`)
        if (regExp.test(dir) && errorHandler) {
          subApp.onError(errorHandler)
        }
      }

      let rootPath = getRootPath(dir)
      if (trailingSlash) {
        rootPath = /\/$/.test(rootPath) ? rootPath : rootPath + '/'
      }
      app.route(rootPath, subApp)
    }
  }

  /**
   * Set Not Found handlers
   */
  for (const map of routesMap.reverse()) {
    const dir = Object.entries(map)[0][0]
    const subApp = new Hono<{
      Variables: Variables
    }>()
    applyNotFound(subApp, dir, notFoundMap)
    const rootPath = getRootPath(dir)
    app.route(rootPath, subApp)
  }

  return app
}

function getNotFoundHandler(dir: string, map: Record<string, Record<string, NotFoundFile>>) {
  for (const [mapDir, content] of Object.entries(map)) {
    if (dir === mapDir) {
      const notFound = content[NOTFOUND_FILENAME]
      if (notFound) {
        return notFound.default
      }
    }
  }
}

function applyNotFound(
  app: Hono<{
    Variables: Variables
  }>,
  dir: string,
  map: Record<string, Record<string, NotFoundFile>>
) {
  for (const [mapDir, content] of Object.entries(map)) {
    if (dir === mapDir) {
      const notFound = content[NOTFOUND_FILENAME]
      if (notFound) {
        const notFoundHandler = notFound.default
        const importingIslands = notFound[IMPORTING_ISLANDS_ID]
        if (importingIslands) {
          app.use('*', (c, next) => {
            c.set(IMPORTING_ISLANDS_ID, true)
            return next()
          })
        }
        app.get('*', (c) => {
          c.status(404)
          return notFoundHandler(c)
        })
      }
    }
  }
}

function getErrorHandler(dir: string, map: Record<string, Record<string, ErrorFile>>) {
  for (const [mapDir, content] of Object.entries(map)) {
    if (dir === mapDir) {
      const errorFile = content[ERROR_FILENAME]
      if (errorFile) {
        const matchedErrorHandler = errorFile.default
        if (matchedErrorHandler) {
          const errorHandler: ErrorHandler = async (error, c) => {
            const importingIslands = errorFile[IMPORTING_ISLANDS_ID]
            if (importingIslands) {
              c.set(IMPORTING_ISLANDS_ID, importingIslands)
            }
            c.status(500)
            return matchedErrorHandler(error, c)
          }
          return errorHandler
        }
      }
    }
  }
}
