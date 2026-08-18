import { buildCreateChildrenFn } from './runtime'

describe('buildCreateChildrenFn', () => {
  it('should set key for children', async () => {
    const createElement = vi.fn()
    const importComponent = vi.fn()
    const createChildren = buildCreateChildrenFn(createElement, importComponent)

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
    const createChildren = buildCreateChildrenFn(createElement, importComponent)

    const island = document.createElement('honox-island')
    island.setAttribute('component-name', '/app/islands/nested.tsx')
    island.setAttribute('component-export', 'NestedIsland')
    island.setAttribute('data-serialized-props', '{"label":"example"}')
    const contentTemplate = document.createElement('template')
    contentTemplate.setAttribute('data-hono-template', 'content')
    contentTemplate.innerHTML = '<span>example</span>'
    island.append(contentTemplate)

    const [nestedIsland] = await createChildren([island] as unknown as NodeListOf<ChildNode>)

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

  it('should restore multiple named template props', async () => {
    const createElement = vi.fn((type, props) => ({ type, props }))
    const NestedIsland = () => null
    const importComponent = vi.fn(async () => NestedIsland)
    const createChildren = buildCreateChildrenFn(createElement, importComponent)

    const island = document.createElement('honox-island')
    island.setAttribute('component-name', '/app/islands/nested.tsx')
    island.setAttribute('data-serialized-props', '{}')
    const contentTemplate = document.createElement('template')
    contentTemplate.setAttribute('data-hono-template', 'content')
    contentTemplate.innerHTML = '<span>content</span>'
    const imageTemplate = document.createElement('template')
    imageTemplate.setAttribute('data-hono-template', 'image')
    imageTemplate.innerHTML = '<img src="/example.png">'
    island.append(contentTemplate, imageTemplate)

    const [nestedIsland] = await createChildren([island] as unknown as NodeListOf<ChildNode>)

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
  })
})
