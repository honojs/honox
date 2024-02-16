import { render } from 'hono/jsx/dom'
import { jsx as jsxFn } from 'hono/jsx/dom/jsx-runtime'
import { COMPONENT_NAME, DATA_HONO_TEMPLATE, DATA_SERIALIZED_PROPS } from '../constants.js'
import type { CreateElement, CreateChildren, Hydrate } from '../types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileCallback = () => Promise<{ default: Promise<any> }>

export type ClientOptions = {
  hydrate?: Hydrate
  createElement?: CreateElement
  /**
   * Create "children" attribute of a component from a list of child nodes
   */
  createChildren?: CreateChildren
  ISLAND_FILES?: Record<string, () => Promise<unknown>>
  island_root?: string
}

export const createClient = async (options?: ClientOptions) => {
  const FILES = options?.ISLAND_FILES ?? import.meta.glob('/app/islands/**/[a-zA-Z0-9[-]+.(tsx|ts)')
  const root = options?.island_root ?? '/app/islands/'

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

          const hydrate = options?.hydrate ?? render
          const createElement = options?.createElement ?? jsxFn

          const maybeTemplate = element.childNodes[element.childNodes.length - 1]
          if (
            maybeTemplate?.nodeName === 'TEMPLATE' &&
            (maybeTemplate as HTMLElement)?.attributes.getNamedItem(DATA_HONO_TEMPLATE) !== null
          ) {
            let createChildren = options?.createChildren
            if (!createChildren) {
              const { buildCreateChildrenFn } = await import('./runtime')
              createChildren = buildCreateChildrenFn(createElement as CreateElement)
            }
            props.children = await createChildren(
              (maybeTemplate as HTMLTemplateElement).content.childNodes
            )
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

  await hydrateComponent()
}
