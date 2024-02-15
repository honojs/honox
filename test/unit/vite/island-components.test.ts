import { transformJsxTags } from '../../../src/vite/island-components.js'

describe('transformJsxTags', () => {
  it('Should add component-wrapper and component-name attribute', () => {
    const code = `export default function Badge() {
      return <h1>Hello</h1>
    }`
    const result = transformJsxTags(code, 'Badge.tsx')
    expect(result).toBe(
      `const BadgeOriginal = function () {
  return <h1>Hello</h1>;
};
const WrappedBadge = function (props) {
  return import.meta.env.SSR ? <honox-island component-name="Badge.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><BadgeOriginal {...props}></BadgeOriginal>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <BadgeOriginal {...props}></BadgeOriginal>;
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
      `const AsyncComponentOriginal = async function () {
  return <h1>Hello</h1>;
};
const WrappedAsyncComponent = async function (props) {
  return import.meta.env.SSR ? <honox-island component-name="AsyncComponent.tsx" data-serialized-props={JSON.stringify(Object.fromEntries(Object.entries(props).filter(([key]) => key !== "children")))}><AsyncComponentOriginal {...props}></AsyncComponentOriginal>{props.children ? <template data-hono-template="">{props.children}</template> : null}</honox-island> : <AsyncComponentOriginal {...props}></AsyncComponentOriginal>;
};
export default WrappedAsyncComponent;`
    )
  })
})
