import path from 'path'
import { transformJsxTags, islandComponents } from './island-components'

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
})

describe('options', () => {
  describe('reactApiImportSource', () => {
    // get full path of ./components.tsx
    const component = path.resolve(__dirname, 'components.tsx')
    it('use \'hono/jsx\' by default', async () => {
      const plugin = islandComponents()
      await (plugin.configResolved as Function)({ root: 'root' })
      const res = await (plugin.load as Function)(component)
      expect(res.code).toMatch(/'hono\/jsx'/)
      expect(res.code).not.toMatch(/'react'/)
    })

    it('enable to specify \'react\'', async () => {
      const plugin = islandComponents({
        reactApiImportSource: 'react',
      })
      await (plugin.configResolved as Function)({ root: 'root' })
      const res = await (plugin.load as Function)(component)
      expect(res.code).not.toMatch(/'hono\/jsx'/)
      expect(res.code).toMatch(/'react'/)
    })
  })
})
