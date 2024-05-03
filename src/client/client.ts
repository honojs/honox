import { render } from 'hono/jsx/dom'
import { jsx as jsxFn } from 'hono/jsx/dom/jsx-runtime'
import { COMPONENT_NAME, DATA_HONO_TEMPLATE, DATA_SERIALIZED_PROPS } from '../constants.js'
import type {
  CreateElement,
  CreateChildren,
  Hydrate,
  HydrateComponent,
  TriggerHydration,
} from '../types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileCallback = () => Promise<{ default: Promise<any> }>

export type ClientOptions = {
  hydrate?: Hydrate
  createElement?: CreateElement
  /**
   * Create "children" attribute of a component from a list of child nodes
   */
  createChildren?: CreateChildren
  /**
   * Trigger hydration on your own
   */
  triggerHydration?: TriggerHydration
  ISLAND_FILES?: Record<string, () => Promise<unknown>>
  island_root?: string
}

export const createClient = async (options?: ClientOptions) => {
  const FILES = options?.ISLAND_FILES ?? {
    ...import.meta.glob('/app/islands/**/[a-zA-Z0-9[-]+.(tsx|ts)'),
    ...import.meta.glob('/app/routes/**/_[a-zA-Z0-9[-]+.island.(tsx|ts)'),
  }

  const root = options?.island_root ?? '/app'

  const hydrateComponent: HydrateComponent = async (document) => {
    const filePromises = Object.keys(FILES).map(async (filePath) => {
      const componentName = filePath.replace(root, '')
      const elements = document.querySelectorAll(
        `[${COMPONENT_NAME}="${componentName}"]:not([data-hono-hydrated])`
      )
      if (elements) {
        const elementPromises = Array.from(elements).map(async (element) => {
          element.setAttribute('data-hono-hydrated', 'true') // mark as hydrated

          const fileCallback = FILES[filePath] as FileCallback
          const file = await fileCallback()
          const Component = await file.default

          const serializedProps = element.attributes.getNamedItem(DATA_SERIALIZED_PROPS)?.value
          const props = JSON.parse(serializedProps ?? '{}') as Record<string, unknown>

          const hydrate = options?.hydrate ?? render
          const createElement = options?.createElement ?? jsxFn

          let maybeTemplate = element.childNodes[element.childNodes.length - 1]
          while (maybeTemplate?.nodeName === 'TEMPLATE') {
            const propKey = (maybeTemplate as HTMLElement).getAttribute(DATA_HONO_TEMPLATE)
            if (propKey == null) {
              break
            }

            let createChildren = options?.createChildren
            if (!createChildren) {
              const { buildCreateChildrenFn } = await import('./runtime')
              createChildren = buildCreateChildrenFn(
                createElement as CreateElement,
                async (name: string) => (await (FILES[`${root}${name}`] as FileCallback)()).default
              )
            }
            props[propKey] = await createChildren(
              (maybeTemplate as HTMLTemplateElement).content.childNodes
            )

            maybeTemplate = maybeTemplate.previousSibling as ChildNode
          }

          const newElem = await createElement(Component, props)
          // @ts-expect-error default `render` cause a type error
          await hydrate(newElem, element)
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
