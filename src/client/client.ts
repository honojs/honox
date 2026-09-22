import {
  COMPONENT_EXPORT,
  COMPONENT_NAME,
  DATA_HONO_TEMPLATE,
  DATA_SERIALIZED_PROPS,
} from '../constants.js'
import honoRenderer from '../renderer/client.js'
import type { ClientRenderer, HydrateComponent, TriggerHydration } from '../types.js'
import { filterByPattern } from './utils/filter.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileCallback = () => Promise<Record<string, Promise<any>>>
const DATA_HONO_ROOT = 'data-hono-root'

export type ClientOptions<TElement = unknown> = {
  /**
   * Trigger hydration on your own
   */
  triggerHydration?: TriggerHydration
  ISLAND_FILES?: Record<string, () => Promise<unknown>>
  /** Renderer used to construct and hydrate island roots. Defaults to Hono JSX DOM. */
  renderer?: ClientRenderer<TElement>
}

export const createClient = async <TElement>(options?: ClientOptions<TElement>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderer: ClientRenderer<any> = options?.renderer ?? honoRenderer
  const FILES =
    options?.ISLAND_FILES ??
    filterByPattern(
      {
        ...import.meta.glob('/app/islands/**/*.tsx'),
        ...import.meta.glob('/app/**/*.island.tsx'),
        ...import.meta.glob('/app/**/$*.tsx'),
      },
      [
        /\/[a-zA-Z0-9-]+\.tsx$/, // /app/islands/**/*.tsx
        /\/_[a-zA-Z0-9-]+\.island\.tsx$/, // /app/**/_*.island.tsx
        /\/\$[a-zA-Z0-9-]+\.tsx$/, // /app/**/$*.tsx
      ]
    )

  const hydrateComponent: HydrateComponent = async (document) => {
    const filePromises = Object.keys(FILES).map(async (filePath) => {
      const componentName = filePath
      const elements = document.querySelectorAll<HTMLElement>(
        `[${COMPONENT_NAME}="${componentName}"]:not([data-hono-hydrated])`
      )
      if (elements) {
        const elementPromises = Array.from(elements).map(async (element) => {
          element.setAttribute('data-hono-hydrated', 'true') // mark as hydrated
          const exportName = element.getAttribute(COMPONENT_EXPORT) || 'default'

          const fileCallback = FILES[filePath] as FileCallback
          const file = await fileCallback()
          const Component = await file[exportName]
          if (!Component) {
            throw new Error(
              `HonoX island component "${componentName}" export "${exportName}" was not found`
            )
          }

          const serializedProps = element.attributes.getNamedItem(DATA_SERIALIZED_PROPS)?.value
          const props = JSON.parse(serializedProps ?? '{}') as Record<string, unknown>

          const rootId = element.getAttribute(DATA_HONO_ROOT)
          if (!rootId) {
            throw new Error('HonoX island root metadata is missing')
          }

          if (element.querySelector(`:scope > template[${DATA_HONO_TEMPLATE}]`)) {
            const { buildCreateChildrenFn, extractIslandTemplates } = await import('./runtime')
            const importComponent = async (name: string, exportName = 'default') => {
              const fileCallback = FILES[name] as FileCallback | undefined
              return fileCallback ? (await fileCallback())[exportName] : undefined
            }
            const createChildren = buildCreateChildrenFn(renderer, importComponent)
            for (const [propKey, template] of extractIslandTemplates(element)) {
              props[propKey] = await createChildren(template.content.childNodes)
            }
          }

          const newElem = await renderer.createElement(Component, props)
          await renderer.hydrateRoot(newElem, element, { id: rootId })
        })
        await Promise.all(elementPromises)
      }
    })

    await Promise.all(filePromises)
  }

  const triggerHydration =
    options?.triggerHydration ??
    (async (hydrateComponent) => {
      if (document.querySelector('template[id^="H:"], template[id^="E:"]')) {
        const { hydrateComponentHonoSuspense } = await import('./runtime')
        await hydrateComponentHonoSuspense(hydrateComponent)
      }

      await hydrateComponent(document)
    })
  await triggerHydration?.(hydrateComponent)
}
