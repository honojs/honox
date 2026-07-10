import { render, createElement as createElementHono } from 'hono/jsx/dom'
import {
  COMPONENT_EXPORT,
  COMPONENT_NAME,
  DATA_HONO_TEMPLATE,
  DATA_SERIALIZED_PROPS,
} from '../constants.js'
import type {
  CreateChildren,
  CreateElement,
  Hydrate,
  HydrateComponent,
  TriggerHydration,
} from '../types.js'
import { isTemplateElement } from './utils/dom.js'
import { filterByPattern } from './utils/filter.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileCallback = () => Promise<Record<string, Promise<any>>>

export type ClientOptions<E = Node> = {
  hydrate?: Hydrate<E>
  createElement?: CreateElement<E>
  /**
   * Create "children" attribute of a component from a list of child nodes
   */
  createChildren?: CreateChildren<E>
  /**
   * Trigger hydration on your own
   */
  triggerHydration?: TriggerHydration
  ISLAND_FILES?: Record<string, () => Promise<unknown>>
  /**
   * @deprecated
   */
  island_root?: string
}

export const createClient = async <E = Node>(options?: ClientOptions<E>) => {
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
      const elements = document.querySelectorAll(
        `[${COMPONENT_NAME}="${componentName}"]:not([data-hono-hydrated])`
      )
      if (elements) {
        const elementPromises = Array.from(elements).map(async (element) => {
          element.setAttribute('data-hono-hydrated', 'true') // mark as hydrated
          const exportName = element.getAttribute(COMPONENT_EXPORT) || 'default'

          const fileCallback = FILES[filePath] as FileCallback
          const file = await fileCallback()
          const Component = await file[exportName]

          const serializedProps = element.attributes.getNamedItem(DATA_SERIALIZED_PROPS)?.value
          const props = JSON.parse(serializedProps ?? '{}') as Record<string, unknown>

          const hydrate = options?.hydrate ?? render
          // The fallback cast is unsound when `E` is specialized without
          // `options.createElement`: hono's `createElement` returns `JSXNode`,
          // not `E`. Callers that customize `E` must supply their own
          // `createElement` (and a matching `hydrate`).
          const createElement = options?.createElement ?? (createElementHono as CreateElement<E>)

          let maybeTemplate: ChildNode | null | undefined =
            element.childNodes[element.childNodes.length - 1]
          while (isTemplateElement(maybeTemplate)) {
            const propKey = maybeTemplate.getAttribute(DATA_HONO_TEMPLATE)
            if (propKey == null) {
              break
            }

            let createChildren = options?.createChildren
            if (!createChildren) {
              const { buildCreateChildrenFn } = await import('./runtime')
              const importComponent = async (name: string) =>
                (await (FILES[`${name}`] as FileCallback)()).default
              createChildren = buildCreateChildrenFn<E>(createElement, importComponent)
            }
            props[propKey] = await createChildren(maybeTemplate.content.childNodes)

            maybeTemplate = maybeTemplate.previousSibling
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
