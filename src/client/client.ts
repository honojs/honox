import { COMPONENT_NAME, DATA_SERIALIZED_PROPS } from '../constants.js'
import type { CreateElement, Hydrate } from '../types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileCallback = () => Promise<{ default: Promise<any> }>

export type ClientOptions = {
  hydrate: Hydrate
  createElement: CreateElement
  ISLAND_FILES?: Record<string, () => Promise<unknown>>
  island_root?: string
}

export const createClient = async (options: ClientOptions) => {
  const FILES = options.ISLAND_FILES ?? import.meta.glob('/app/islands/**/[a-zA-Z0-9[-]+.(tsx|ts)')
  const root = options.island_root ?? '/app/islands/'

  const hydrateComponent = async () => {
    const filePromises = Object.keys(FILES).map(async (filePath) => {
      const componentName = filePath.replace(root, '')
      const elements = document.querySelectorAll(`[${COMPONENT_NAME}="${componentName}"]`)
      if (elements) {
        const elementPromises = Array.from(elements).map(async (element) => {
          const fileCallback = FILES[filePath] as FileCallback
          const file = await fileCallback()
          const Component = await file.default

          const serializedProps = element.attributes.getNamedItem(DATA_SERIALIZED_PROPS)?.value
          const props = JSON.parse(serializedProps ?? '{}') as Record<string, unknown>

          const hydrate = options.hydrate
          const createElement = options.createElement

          const newElem = await createElement(Component, props)
          await hydrate(newElem, element)
        })
        await Promise.all(elementPromises)
      }
    })

    await Promise.all(filePromises)
  }

  await hydrateComponent()
}
