import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { IMPORTING_ISLANDS_ID } from '../constants'
import { injectImportingIslands } from './inject-importing-islands'

describe('injectImportingIslands', () => {
  let tmpDir: string

  const createFile = async (filePath: string, content: string) => {
    const fullPath = path.join(tmpDir, filePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, content)
    return fullPath
  }

  const setupPlugin = async () => {
    const plugin = await injectImportingIslands({
      appDir: '/app',
    })

    // Simulate configResolved
    const configResolved = plugin.configResolved as Function
    await configResolved({ root: tmpDir })

    return plugin
  }

  const callTransform = async (
    plugin: ReturnType<typeof setupPlugin> extends Promise<infer T> ? T : never,
    filePath: string,
    sourceCode: string,
    beforeResolve?: (importee: string, importer?: string) => Promise<void>
  ) => {
    const transform = plugin.transform as Function
    const context = {
      resolve: async (importee: string, importer?: string) => {
        await beforeResolve?.(importee, importer)
        // Simulate Vite's resolve: resolve relative paths based on importer
        if (importee.startsWith('.')) {
          const base = importer ? path.dirname(importer) : tmpDir
          const resolved = path.resolve(base, importee)
          // Try with .tsx extension if not already present
          const candidates = [
            resolved,
            resolved + '.tsx',
            resolved + '.ts',
            resolved.replace(/\.js$/, '.tsx'),
            resolved.replace(/\.js$/, '.ts'),
          ]
          for (const candidate of candidates) {
            try {
              await fs.access(candidate)
              return { id: candidate }
            } catch {
              // continue
            }
          }
        }
        return null
      },
    }
    return await transform.call(context, sourceCode, filePath)
  }

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'honox-test-'))
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true })
  })

  it('should inject flag for direct island import', async () => {
    await createFile(
      'app/components/$counter.tsx',
      `
      import { useState } from 'hono/jsx'
      export default function Counter() {
        const [count, setCount] = useState(0)
        return <div>{count}</div>
      }
    `
    )

    const routePath = await createFile(
      'app/routes/index.tsx',
      `
      import Counter from "../components/$counter.tsx"
      export default function Page() {
        return <Counter />
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin()
    const result = await callTransform(plugin, routePath, routeSource)

    expect(result).not.toBeUndefined()
    expect(result.code).toContain(IMPORTING_ISLANDS_ID)
  })

  it('should inject flag for indirect island import through wrapper', async () => {
    await createFile(
      'app/components/$counter.tsx',
      `
      import { useState } from 'hono/jsx'
      export default function Counter() {
        const [count, setCount] = useState(0)
        return <div>{count}</div>
      }
    `
    )

    await createFile(
      'app/components/wrapper.tsx',
      `
      import Counter from "./$counter.tsx"
      export default function Wrapper() {
        return <Counter />
      }
    `
    )

    const routePath = await createFile(
      'app/routes/case2.tsx',
      `
      import Wrapper from "../components/wrapper.tsx"
      export default function Page() {
        return <Wrapper />
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin()
    const result = await callTransform(plugin, routePath, routeSource)

    expect(result).not.toBeUndefined()
    expect(result.code).toContain(IMPORTING_ISLANDS_ID)
  })

  it('should not inject flag when no island components are imported', async () => {
    await createFile(
      'app/components/plain.tsx',
      `
      export default function Plain() {
        return <div>plain</div>
      }
    `
    )

    const routePath = await createFile(
      'app/routes/no-island.tsx',
      `
      import Plain from "../components/plain.tsx"
      export default function Page() {
        return <Plain />
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin()
    const result = await callTransform(plugin, routePath, routeSource)

    expect(result).toBeUndefined()
  })

  it('should inject flag for deeply nested indirect island import', async () => {
    await createFile(
      'app/components/$counter.tsx',
      `
      export default function Counter() {
        return <div>counter</div>
      }
    `
    )

    await createFile(
      'app/components/inner.tsx',
      `
      import Counter from "./$counter.tsx"
      export default function Inner() {
        return <Counter />
      }
    `
    )

    await createFile(
      'app/components/outer.tsx',
      `
      import Inner from "./inner.tsx"
      export default function Outer() {
        return <Inner />
      }
    `
    )

    const routePath = await createFile(
      'app/routes/deep.tsx',
      `
      import Outer from "../components/outer.tsx"
      export default function Page() {
        return <Outer />
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin()
    const result = await callTransform(plugin, routePath, routeSource)

    expect(result).not.toBeUndefined()
    expect(result.code).toContain(IMPORTING_ISLANDS_ID)
  })

  it('should resolve the same relative specifier from different importers', async () => {
    await createFile(
      'app/islands/$counter.tsx',
      'export default function Counter() { return <div>counter</div> }'
    )

    const routes = await Promise.all(
      ['route-a', 'route-b'].map(async (route) => {
        await createFile(
          'app/routes/' + route + '/pwd.ts',
          'import Counter from "../../islands/$counter.js"; export { Counter }'
        )
        return createFile(
          'app/routes/' + route + '/index.tsx',
          'import "./pwd.js"; export default function Page() { return <div /> }'
        )
      })
    )

    const plugin = await setupPlugin()
    for (const routePath of routes) {
      const source = await fs.readFile(routePath, 'utf-8')
      const result = await callTransform(plugin, routePath, source)
      expect(result).not.toBeUndefined()
      expect(result.code).toContain(IMPORTING_ISLANDS_ID)
    }
  })

  it('should not expose incomplete dependency trees to concurrent transforms', async () => {
    await createFile(
      'app/islands/$counter.tsx',
      'export default function Counter() { return <div>counter</div> }'
    )
    await createFile(
      'app/components/shared.ts',
      'import Counter from "../islands/$counter.js"; export { Counter }'
    )

    const routes = await Promise.all(
      ['route-c', 'route-d'].map(async (route) => {
        await createFile(
          'app/routes/' + route + '/pwd.ts',
          'import { Counter } from "../../components/shared.js"; export { Counter }'
        )
        return createFile(
          'app/routes/' + route + '/index.tsx',
          'import "./pwd.js"; export default function Page() { return <div /> }'
        )
      })
    )

    let sharedResolveCount = 0
    let releaseSharedResolves!: () => void
    const sharedResolvesReady = new Promise<void>((resolve) => {
      releaseSharedResolves = resolve
    })
    const waitForSharedResolves = async (importee: string) => {
      if (importee !== '../../components/shared.js') return
      sharedResolveCount++
      if (sharedResolveCount === routes.length) releaseSharedResolves()
      await sharedResolvesReady
    }

    const plugin = await setupPlugin()
    const results = await Promise.all(
      routes.map(async (routePath) => {
        const source = await fs.readFile(routePath, 'utf-8')
        return callTransform(plugin, routePath, source, waitForSharedResolves)
      })
    )

    for (const result of results) {
      expect(result).not.toBeUndefined()
      expect(result.code).toContain(IMPORTING_ISLANDS_ID)
    }
  })
  it('should handle circular dependencies', async () => {
    await createFile(
      'app/islands/$counter.tsx',
      'export default function Counter() { return <div>counter</div> }'
    )
    await createFile(
      'app/components/a.tsx',
      'import B from "./b.js"; export default function A() { return <B /> }'
    )
    await createFile(
      'app/components/b.tsx',
      'import A from "./a.js"; import Counter from "../islands/$counter.js"; export default function B() { return <><A /><Counter /></> }'
    )
    const routePath = await createFile(
      'app/routes/circular.tsx',
      'import A from "../components/a.js"; export default function Page() { return <A /> }'
    )

    const source = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin()
    const result = await callTransform(plugin, routePath, source)

    expect(result).not.toBeUndefined()
    expect(result.code).toContain(IMPORTING_ISLANDS_ID)
  })
})
