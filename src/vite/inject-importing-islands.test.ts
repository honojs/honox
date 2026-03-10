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
    sourceCode: string
  ) => {
    const transform = plugin.transform as Function
    const context = {
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
})
