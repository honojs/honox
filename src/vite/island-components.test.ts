import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { islandComponents, transformJsxTags } from './island-components.js'

describe('transformJsxTags', () => {
  it('Should add component-wrapper and component-name attribute', () => {
    const code = `export default function Badge() {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'Badge.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
const BadgeOriginal = function () {
  return <h1>Hello</h1>;
};
const WrappedBadge = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="Badge.tsx" Component={BadgeOriginal} props={props} /> : <BadgeOriginal {...props}></BadgeOriginal>;
};
export default WrappedBadge;`
    )
  })

  it('Should add component-wrapper and component-name attribute for named export', () => {
    const code = `function Badge() {
      return <h1>Hello</h1>
    }
    export { Badge }
    `
    const result = transformJsxTags(code, 'Badge.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
function Badge() {
  return <h1>Hello</h1>;
}
const WrappedBadge = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="Badge.tsx" Component={Badge} props={props} componentExport="Badge" /> : <Badge {...props}></Badge>;
};
export { WrappedBadge as Badge };`
    )
  })

  it('Should add component-wrapper and component-name attribute for named function', () => {
    const code = `export function Badge() {
      return <h1>Hello</h1>
    }
    `
    const result = transformJsxTags(code, 'Badge.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
function Badge() {
  return <h1>Hello</h1>;
}
const WrappedBadge = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="Badge.tsx" Component={Badge} props={props} componentExport="Badge" /> : <Badge {...props}></Badge>;
};
export { WrappedBadge as Badge };`
    )
  })

  it('Should add component-wrapper and component-name attribute for variable', () => {
    const code = `export const Badge = () => {
      return <h1>Hello</h1>
    }
    `
    const result = transformJsxTags(code, 'Badge.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
const Badge = () => {
  return <h1>Hello</h1>;
};
const WrappedBadge = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="Badge.tsx" Component={Badge} props={props} componentExport="Badge" /> : <Badge {...props}></Badge>;
};
export { WrappedBadge as Badge };`
    )
  })

  it('Should not transform constant', () => {
    const code = `export const MAX = 10
    const MIN = 0
    export { MIN }
    `
    const result = transformJsxTags(code, 'Badge.tsx')
    expect(result).toBe(
      `export const MAX = 10;
const MIN = 0;
export { MIN };`
    )
  })

  it('Should not transform if it is blank', () => {
    const code = transformJsxTags('', 'Badge.tsx')
    expect(code).toBe('')
  })

  it('async', () => {
    const code = `export default async function AsyncComponent() {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'AsyncComponent.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
const AsyncComponentOriginal = async function () {
  return <h1>Hello</h1>;
};
const WrappedAsyncComponent = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="AsyncComponent.tsx" Component={AsyncComponentOriginal} props={props} /> : <AsyncComponentOriginal {...props}></AsyncComponentOriginal>;
};
export default WrappedAsyncComponent;`
    )
  })

  it('unnamed', () => {
    const code = `export default async function() {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'UnnamedComponent.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
const __HonoIsladComponent__Original = async function () {
  return <h1>Hello</h1>;
};
const Wrapped__HonoIsladComponent__ = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="UnnamedComponent.tsx" Component={__HonoIsladComponent__Original} props={props} /> : <__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>;
};
export default Wrapped__HonoIsladComponent__;`
    )
  })

  it('arrow - block', () => {
    const code = `export default () => {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'UnnamedComponent.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
const __HonoIsladComponent__Original = () => {
  return <h1>Hello</h1>;
};
const Wrapped__HonoIsladComponent__ = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="UnnamedComponent.tsx" Component={__HonoIsladComponent__Original} props={props} /> : <__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>;
};
export default Wrapped__HonoIsladComponent__;`
    )
  })

  it('arrow - expression', () => {
    const code = 'export default () => <h1>Hello</h1>'
    const result = transformJsxTags(code, 'UnnamedComponent.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
const __HonoIsladComponent__Original = () => <h1>Hello</h1>;
const Wrapped__HonoIsladComponent__ = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="UnnamedComponent.tsx" Component={__HonoIsladComponent__Original} props={props} /> : <__HonoIsladComponent__Original {...props}></__HonoIsladComponent__Original>;
};
export default Wrapped__HonoIsladComponent__;`
    )
  })

  it('export via variable', () => {
    const code = 'export default ExportViaVariable'
    const result = transformJsxTags(code, 'ExportViaVariable.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
const WrappedExportViaVariable = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="ExportViaVariable.tsx" Component={ExportViaVariable} props={props} /> : <ExportViaVariable {...props}></ExportViaVariable>;
};
export default WrappedExportViaVariable;`
    )
  })

  it('export via specifier', () => {
    const code = `const utilityFn = () => {}
const ExportViaVariable = () => <h1>Hello</h1>
export { utilityFn, ExportViaVariable as default }`
    const result = transformJsxTags(code, 'ExportViaVariable.tsx')
    expect(result).toBe(
      `import { HonoXIsland } from "honox/vite/components";
const utilityFn = () => {};
const ExportViaVariable = () => <h1>Hello</h1>;
const WrappedExportViaVariable = function (props) {
  return import.meta.env.SSR ? <HonoXIsland componentName="ExportViaVariable.tsx" Component={ExportViaVariable} props={props} /> : <ExportViaVariable {...props}></ExportViaVariable>;
};
export { utilityFn, WrappedExportViaVariable as default };`
    )
  })

  describe('component name or not', () => {
    const codeTemplate = `export function %s() {
  return <h1>Hello</h1>;
}`
    test.each([
      'Badge', // simple name
      'BadgeComponent', // camel case
      'BadgeComponent0', // end with number
      'BadgeComponentA', // end with capital letter
      'B1Badge', // "B1" prefix
    ])('Should transform %s as component name', (name) => {
      const code = codeTemplate.replace('%s', name)
      const result = transformJsxTags(code, `${name}.tsx`)
      expect(result).not.toBe(code)
    })

    test.each([
      'utilityFn', // lower camel case
      'utility_fn', // snake case
      'Utility_Fn', // capital snake case
      'MAX', // all capital (constant)
      'MAX_LENGTH', // all capital with underscore (constant)
      'M', // single capital (constant)
      'M1', // single capital with number (constant)
    ])('Should not transform %s as component name', (name) => {
      const code = codeTemplate.replace('%s', name)
      const result = transformJsxTags(code, `${name}.tsx`)
      expect(result).toBe(code)
    })
  })
})

describe('options', () => {
  describe('reactApiImportSource', () => {
    describe('vite/components', async () => {
      const honoPattern = /'hono\/jsx'/
      const reactPattern = /'react'/
      const setup = async () => {
        // get full path of honox-island.tsx
        const component = path
          .resolve(__dirname, '../vite/components/honox-island.tsx')
          // replace backslashes for Windows
          .replace(/\\/g, '/')
        const componentContent = await fs.readFile(component, 'utf8')
        return { component, componentContent }
      }

      test.each([
        {
          name: 'default with both config files (prefers deno.json over tsconfig.json)',
          configFiles: {
            'deno.json': { jsxImportSource: 'react' },
            'tsconfig.json': { jsxImportSource: 'hono/jsx' },
          },
          config: {},
          expect: { hono: false, react: true },
        },
        {
          name: 'default with both config files (prefers deno.json over deno.jsonc)',
          configFiles: {
            'deno.json': { jsxImportSource: 'react' },
            'deno.jsonc': { jsxImportSource: 'hono/jsx' },
          },
          config: {},
          expect: { hono: false, react: true },
        },
        {
          name: 'default with both config files (prefers deno.jsonc over tsconfig.json)',
          configFiles: {
            'deno.jsonc': { jsxImportSource: 'react' },
            'tsconfig.json': { jsxImportSource: 'hono/jsx' },
          },
          config: {},
          expect: { hono: false, react: true },
        },
        {
          name: 'default with only deno.json',
          configFiles: {
            'deno.json': { jsxImportSource: 'react' },
          },
          config: {},
          expect: { hono: false, react: true },
        },
        {
          name: 'default with only deno.jsonc',
          configFiles: {
            'deno.jsonc': { jsxImportSource: 'react' },
          },
          config: {},
          expect: { hono: false, react: true },
        },
        {
          name: 'default with only tsconfig.json',
          configFiles: {
            'tsconfig.json': { jsxImportSource: 'react' },
          },
          config: {},
          expect: { hono: false, react: true },
        },
        {
          name: 'explicit react config overrides all',
          configFiles: {
            'deno.json': { jsxImportSource: 'hono/jsx' },
            'deno.jsonc': { jsxImportSource: 'hono/jsx' },
            'tsconfig.json': { jsxImportSource: 'hono/jsx' },
          },
          config: { reactApiImportSource: 'react' },
          expect: { hono: false, react: true },
        },
      ])('should handle $name', async (testCase) => {
        const { component, componentContent } = await setup()

        vi.spyOn(fs, 'readFile').mockImplementation(async (filePath) => {
          if (filePath.toString().includes('honox-island.tsx')) {
            return componentContent
          }
          for (const [fileName, config] of Object.entries(testCase.configFiles)) {
            if (filePath.toString().includes(fileName)) {
              return JSON.stringify({ compilerOptions: config })
            }
            throw new Error('Config file does not exist')
          }
          return ''
        })

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const plugin = islandComponents(testCase.config)
        await (plugin.configResolved as Function)({ root: 'root' })
        const res = await (plugin.load as Function)(component)

        expect(honoPattern.test(res.code)).toBe(testCase.expect.hono)
        expect(reactPattern.test(res.code)).toBe(testCase.expect.react)

        if (Object.keys(testCase.configFiles).length === 0) {
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            'Cannot find neither tsconfig.json nor deno.json',
            expect.any(Error),
            expect.any(Error)
          )
        }
      })
    })

    describe('server/components', async () => {
      beforeEach(() => {
        vi.restoreAllMocks()
      })

      const tmpdir = os.tmpdir()

      // has-islands.tsx under src/server/components does not contain 'hono/jsx'
      // 'hono/jsx' is injected by `npm run build`
      // so we need to create a file with 'hono/jsx' manually for testing
      const component = path
        .resolve(tmpdir, 'honox/dist/server/components/has-islands.js')
        // replace backslashes for Windows
        .replace(/\\/g, '/')
      await fs.mkdir(path.dirname(component), { recursive: true })
      // prettier-ignore
      await fs.writeFile(component, 'import { jsx } from \'hono/jsx/jsx-runtime\'')

      // prettier-ignore
      it('use \'hono/jsx\' by default', async () => {
        const plugin = islandComponents()
        await (plugin.configResolved as Function)({ root: 'root' })
        const res = await (plugin.load as Function)(component)
        expect(res.code).toMatch(/'hono\/jsx\/jsx-runtime'/)
        expect(res.code).not.toMatch(/'react\/jsx-runtime'/)
      })

      // prettier-ignore
      it('enable to specify \'react\'', async () => {
        const plugin = islandComponents({
          reactApiImportSource: 'react',
        })
        await (plugin.configResolved as Function)({ root: 'root' })
        const res = await (plugin.load as Function)(component)
        expect(res.code).not.toMatch(/'hono\/jsx\/jsx-runtime'/)
        expect(res.code).toMatch(/'react\/jsx-runtime'/)
      })
    })
  })
})
