import type { CreateElement } from '../types'
import { buildCreateChildrenFn } from './runtime'

describe('buildCreateChildrenFn', () => {
  const createRenderer = <TElement>(createElement: CreateElement<TElement>) => ({
    createElement,
    hydrateRoot: vi.fn(),
  })

  it('should set key for children', async () => {
    const createElement = vi.fn()
    const importComponent = vi.fn()
    const createChildren = buildCreateChildrenFn(createRenderer(createElement), importComponent)

    const div = document.createElement('div')
    div.innerHTML = '<span>test</span><div>test2</div>'
    await createChildren(div.childNodes)
    expect(createElement).toHaveBeenNthCalledWith(1, 'SPAN', {
      children: ['test'],
      key: 1,
    })
    expect(createElement).toHaveBeenNthCalledWith(2, 'DIV', {
      children: ['test2'],
      key: 2,
    })
  })

  it('should restore nested island exports and named template props', async () => {
    const createElement = vi.fn((type, props) => ({ type, props }))
    const NestedIsland = () => null
    const importComponent = vi.fn(async (name, exportName) => {
      expect(name).toBe('/app/islands/nested.tsx')
      expect(exportName).toBe('NestedIsland')
      return NestedIsland
    })
    const createChildren = buildCreateChildrenFn(createRenderer(createElement), importComponent)

    const island = document.createElement('honox-island')
    island.setAttribute('component-name', '/app/islands/nested.tsx')
    island.setAttribute('component-export', 'NestedIsland')
    island.setAttribute('data-serialized-props', '{"label":"example"}')
    const contentTemplate = document.createElement('template')
    contentTemplate.setAttribute('data-hono-template', 'content')
    contentTemplate.innerHTML = '<span>example</span>'
    const root = document.createElement('div')
    island.append(contentTemplate)
    root.append(island)

    const [nestedIsland] = await createChildren(root.childNodes)

    expect(importComponent).toHaveBeenCalledWith('/app/islands/nested.tsx', 'NestedIsland')
    expect(nestedIsland).toEqual({
      type: NestedIsland,
      props: {
        key: 2,
        label: 'example',
        content: [
          {
            type: 'SPAN',
            props: { children: ['example'], key: 1 },
          },
        ],
      },
    })
  })

  it('restores multiple named template props without consuming following siblings', async () => {
    const NestedIsland = () => null
    const island = document.createElement('honox-island')
    island.setAttribute('component-name', '/app/islands/nested.tsx')
    island.setAttribute('data-serialized-props', '{}')
    const contentTemplate = document.createElement('template')
    contentTemplate.setAttribute('data-hono-template', 'content')
    contentTemplate.innerHTML = '<span>content</span>'
    const imageTemplate = document.createElement('template')
    imageTemplate.setAttribute('data-hono-template', 'image')
    imageTemplate.innerHTML = '<img src="/example.png">'
    const plainTemplate = document.createElement('template')
    plainTemplate.id = 'plain'
    const sibling = document.createElement('hr')
    const root = document.createElement('div')
    island.append(contentTemplate, imageTemplate)
    root.append(island, plainTemplate, sibling)
    const createElement = vi.fn((type, props) => ({ type, props }))
    const createChildren = buildCreateChildrenFn(
      createRenderer(createElement),
      vi.fn(async () => NestedIsland)
    )

    const [nestedIsland, followingTemplate, followingSibling] = await createChildren(
      root.childNodes
    )

    expect(nestedIsland).toEqual({
      type: NestedIsland,
      props: {
        key: 3,
        content: [
          {
            type: 'SPAN',
            props: { children: ['content'], key: expect.any(Number) },
          },
        ],
        image: [
          {
            type: 'IMG',
            props: { children: [], src: '/example.png', key: expect.any(Number) },
          },
        ],
      },
    })
    expect(followingTemplate).toEqual({
      type: 'TEMPLATE',
      props: { children: [], id: 'plain', key: expect.any(Number) },
    })
    expect(followingSibling).toEqual({
      type: 'HR',
      props: { children: [], key: expect.any(Number) },
    })
  })

  it('rejects missing island components', async () => {
    const createChildren = buildCreateChildrenFn(
      createRenderer(vi.fn()),
      vi.fn(async () => undefined)
    )
    const root = document.createElement('div')
    root.innerHTML = '<honox-island component-name="example"></honox-island>'

    await expect(createChildren(root.childNodes)).rejects.toThrow(
      'HonoX island component "example" export "default" was not found'
    )
  })

  it('should not treat user templates as suspense placeholders', async () => {
    const createElement = vi.fn((type, props) => ({ type, props }))
    const importComponent = vi.fn()
    const createChildren = buildCreateChildrenFn(createRenderer(createElement), importComponent)

    const div = document.createElement('div')
    div.innerHTML = '<template id="SEARCH:1"></template>'
    const [child] = await createChildren(div.childNodes)

    expect(child).toEqual({
      type: 'TEMPLATE',
      props: { children: [], id: 'SEARCH:1', key: 1 },
    })
  })

  it('throws when the renderer does not support streamed Suspense', async () => {
    const div = document.createElement('div')
    div.innerHTML = '<template id="H:1"></template>'
    const createChildren = buildCreateChildrenFn(createRenderer(vi.fn()), vi.fn())

    await expect(createChildren(div.childNodes)).rejects.toThrow(
      'The renderer does not support streamed Suspense content'
    )
  })
})
