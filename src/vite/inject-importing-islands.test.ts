import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { IMPORTING_ISLANDS_ID } from '../constants'
import { injectImportingIslands } from './inject-importing-islands'
import honox from './index'

describe('injectImportingIslands', () => {
  let tmpDir: string

  const createFile = async (filePath: string, content: string) => {
    const fullPath = path.join(tmpDir, filePath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, content)
    return fullPath
  }

  const resolveContext = {
    resolve: async (importee: string, importer?: string) => {
      // Simulate Vite's resolve: resolve relative paths based on importer
      if (importee.startsWith('.')) {
        const base = importer ? path.dirname(importer) : tmpDir
        const resolved = path.resolve(base, importee)
        // Try with .tsx extension if not already present
        const candidates = [resolved, resolved + '.tsx', resolved + '.ts']
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

  const configurePlugin = async (plugin: Awaited<ReturnType<typeof injectImportingIslands>>) => {
    // Simulate configResolved
    const configResolved = plugin.configResolved as Function
    await configResolved({ root: tmpDir })
  }

  const setupPlugin = async (options?: Parameters<typeof injectImportingIslands>[0]) => {
    const plugin = await injectImportingIslands({
      appDir: '/app',
      ...options,
    })

    await configurePlugin(plugin)

    return plugin
  }

  const setupPluginFromHonox = async (options?: Parameters<typeof honox>[0]) => {
    const plugins = await Promise.all(honox(options).map((plugin) => plugin))
    const plugin = plugins.find(
      (candidate): candidate is Awaited<ReturnType<typeof injectImportingIslands>> =>
        typeof candidate === 'object' &&
        candidate !== null &&
        'name' in candidate &&
        candidate.name === 'inject-importing-islands'
    )

    if (!plugin) {
      throw new Error('inject-importing-islands plugin not found')
    }

    await configurePlugin(plugin)
    return plugin
  }

  const callTransform = async (
    plugin: ReturnType<typeof setupPlugin> extends Promise<infer T> ? T : never,
    filePath: string,
    sourceCode: string
  ) => {
    const transform = plugin.transform as Function
    return await transform.call(resolveContext, sourceCode, filePath)
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
  it('should clear dependency caches between builds', async () => {
    const componentPath = await createFile(
      'app/components/toggle.tsx',
      `
      export default function Toggle() {
        return <div>plain</div>
      }
    `
    )

    await createFile(
      'app/components/$counter.tsx',
      `
      export default function Counter() {
        return <div>counter</div>
      }
    `
    )

    const routePath = await createFile(
      'app/routes/cache.tsx',
      `
      import Toggle from "../components/toggle.tsx"
      export default function Page() {
        return <Toggle />
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin()

    const firstResult = await callTransform(plugin, routePath, routeSource)
    expect(firstResult).toBeUndefined()

    await fs.writeFile(
      componentPath,
      `
      import Counter from "./$counter.tsx"
      export default function Toggle() {
        return <Counter />
      }
    `
    )

    const buildStart = plugin.buildStart as Function
    await buildStart()

    const secondResult = await callTransform(plugin, routePath, routeSource)
    expect(secondResult).not.toBeUndefined()
    expect(secondResult.code).toContain(IMPORTING_ISLANDS_ID)
  })
  it('should cache resolutions per importer', async () => {
    await createFile(
      'app/components/a/shared.tsx',
      `
      export default function Shared() {
        return <div>plain</div>
      }
    `
    )

    await createFile(
      'app/components/a/wrapper.tsx',
      `
      import Shared from "./shared"
      export default function WrapperA() {
        return <Shared />
      }
    `
    )

    await createFile(
      'app/components/b/$counter.tsx',
      `
      export default function Counter() {
        return <div>counter</div>
      }
    `
    )

    await createFile(
      'app/components/b/shared.tsx',
      `
      import Counter from "./$counter"
      export default function Shared() {
        return <Counter />
      }
    `
    )

    await createFile(
      'app/components/b/wrapper.tsx',
      `
      import Shared from "./shared"
      export default function WrapperB() {
        return <Shared />
      }
    `
    )

    const routePath = await createFile(
      'app/routes/importer-cache.tsx',
      `
      import WrapperA from "../components/a/wrapper.tsx"
      import WrapperB from "../components/b/wrapper.tsx"
      export default function Page() {
        return (
          <>
            <WrapperA />
            <WrapperB />
          </>
        )
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin()
    const result = await callTransform(plugin, routePath, routeSource)

    expect(result).not.toBeUndefined()
    expect(result.code).toContain(IMPORTING_ISLANDS_ID)
  })

  it('should skip excluded directories during island detection', async () => {
    await createFile(
      'node_modules/pkg/$counter.tsx',
      `
      export default function Counter() {
        return <div>counter</div>
      }
    `
    )

    await createFile(
      'app/components/from-package.tsx',
      `
      import Counter from "../../node_modules/pkg/$counter.tsx"
      export default function FromPackage() {
        return <Counter />
      }
    `
    )

    const routePath = await createFile(
      'app/routes/exclude.tsx',
      `
      import FromPackage from "../components/from-package.tsx"
      export default function Page() {
        return <FromPackage />
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin({
      exclude: ['node_modules'],
    })
    const result = await callTransform(plugin, routePath, routeSource)

    expect(result).toBeUndefined()
  })

  it('should not exclude partial directory name matches', async () => {
    await createFile(
      'app/components-old/$counter.tsx',
      `
      export default function Counter() {
        return <div>counter</div>
      }
    `
    )

    const routePath = await createFile(
      'app/routes/partial-match.tsx',
      `
      import Counter from "../components-old/$counter.tsx"
      export default function Page() {
        return <Counter />
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPlugin({
      exclude: ['components'],
    })
    const result = await callTransform(plugin, routePath, routeSource)

    expect(result).not.toBeUndefined()
    expect(result.code).toContain(IMPORTING_ISLANDS_ID)
  })

  it('should pass injectImportingIslands options through honox', async () => {
    await createFile(
      'node_modules/pkg/$counter.tsx',
      `
      export default function Counter() {
        return <div>counter</div>
      }
    `
    )

    await createFile(
      'app/components/from-package.tsx',
      `
      import Counter from "../../node_modules/pkg/$counter.tsx"
      export default function FromPackage() {
        return <Counter />
      }
    `
    )

    const routePath = await createFile(
      'app/routes/honox.tsx',
      `
      import FromPackage from "../components/from-package.tsx"
      export default function Page() {
        return <FromPackage />
      }
    `
    )

    const routeSource = await fs.readFile(routePath, 'utf-8')
    const plugin = await setupPluginFromHonox({
      injectImportingIslands: {
        appDir: '/app',
        exclude: ['node_modules'],
      },
    })
    const result = await callTransform(plugin, routePath, routeSource)

    expect(result).toBeUndefined()
  })
})
