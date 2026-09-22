import { vi } from 'vitest'
import { createClient } from './client'

const componentName = '/app/islands/example.tsx'
const Component = () => null
const renderer = {
  createElement: vi.fn(),
  hydrateRoot: vi.fn(),
}
const options = {
  renderer,
  ISLAND_FILES: { [componentName]: async () => ({ default: Component }) },
  triggerHydration: (hydrate: (document: Document) => Promise<void>) => hydrate(document),
}

beforeEach(() => {
  document.body.replaceChildren()
  vi.resetAllMocks()
})

it('passes the server root ID to the client renderer', async () => {
  const rendered = {}
  renderer.createElement.mockReturnValue(rendered)
  document.body.innerHTML =
    `<honox-island component-name="${componentName}" ` + 'data-hono-root="honox-7"></honox-island>'

  await createClient(options)

  const island = document.querySelector('honox-island') as HTMLElement
  expect(renderer.hydrateRoot).toHaveBeenCalledWith(rendered, island, { id: 'honox-7' })
})

it('restores and removes top-level template props before hydration', async () => {
  renderer.createElement.mockImplementation((type, props) => ({ type, props }))
  document.body.innerHTML =
    `<honox-island component-name="${componentName}" ` +
    'data-hono-root="honox-1">' +
    '<template data-hono-template="children"><span>child</span></template>' +
    '</honox-island>'

  await createClient(options)

  const island = document.querySelector('honox-island') as HTMLElement
  expect(renderer.createElement).toHaveBeenLastCalledWith(Component, {
    children: [{ type: 'SPAN', props: { children: ['child'], key: expect.any(Number) } }],
  })
  expect(island.querySelector('template[data-hono-template]')).toBeNull()
})

it('rejects missing top-level island components', async () => {
  document.body.innerHTML =
    `<honox-island component-name="${componentName}" ` +
    'component-export="missing" data-hono-root="honox-1"></honox-island>'

  await expect(createClient(options)).rejects.toThrow(
    `HonoX island component "${componentName}" export "missing" was not found`
  )
})

it('rejects missing island root metadata', async () => {
  document.body.innerHTML = `<honox-island component-name="${componentName}"></honox-island>`

  await expect(createClient(options)).rejects.toThrow('HonoX island root metadata is missing')
})
