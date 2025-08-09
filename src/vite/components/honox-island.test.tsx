import { HonoXIsland } from './honox-island'

const TestComponent = () => <div>Test</div>

describe('HonoXIsland', () => {
  it('should set key for children', () => {
    const element = HonoXIsland({
      componentName: 'Test',
      componentExport: 'Test',
      Component: () => <div>Test</div>,
      props: {
        children: <TestComponent />,
      },
    })
    // XXX: tested by internal implementation
    expect((element as any).children[1][0].key).toBe('children')
  })
})
