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
})
