import type { Child } from 'hono/jsx'
import { renderToString } from 'hono/jsx/dom/server'
import renderer from '../../renderer/server'
import { withServerRenderer } from '../../server/renderer-context'
import { HonoXIsland } from './honox-island'

describe('HonoXIsland', () => {
  const render = (element: Child) => withServerRenderer(renderer, () => renderToString(element))

  it('associates element props with their island root', () => {
    const html = render(
      <HonoXIsland
        componentName='Test'
        Component={() => <div>Test</div>}
        props={{ children: <div>Test</div> }}
      />
    )

    const document = new DOMParser().parseFromString(html, 'text/html')
    const island = document.querySelector('honox-island')
    const template = island?.querySelector(':scope > template[data-hono-template="children"]')
    expect(template?.innerHTML).toBe('<div>Test</div>')
  })

  it('allocates independent deterministic roots', () => {
    const rootIds = () => {
      const html = render(
        <div>
          <HonoXIsland componentName='Test' Component={() => null} props={{}} />
          <HonoXIsland componentName='Test' Component={() => null} props={{}} />
        </div>
      )
      return [...html.matchAll(/data-hono-root="([^"]+)"/g)].map(([, id]) => id)
    }

    expect(rootIds()).toEqual(['honox-0', 'honox-1'])
    expect(rootIds()).toEqual(['honox-0', 'honox-1'])
  })

  it('coalesces nested islands into the parent root', () => {
    const Nested = () => (
      <HonoXIsland componentName='Nested' Component={() => <span>Nested</span>} props={{}} />
    )
    const html = render(
      <HonoXIsland
        componentName='Parent'
        Component={() => (
          <div>
            Parent
            <Nested />
          </div>
        )}
        props={{}}
      />
    )

    expect(html.match(/<honox-island/g)).toHaveLength(1)
    expect(html).toContain('<div>Parent<span>Nested</span></div>')
  })
})
