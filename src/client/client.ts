import { render, Suspense, use } from 'hono/jsx/dom'
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

const buildCreateChildrenFn = (createElement: CreateElement): CreateChildren => {
  const createChildren = (childNodes: NodeListOf<ChildNode>): Node[] => {
    const children = []
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i] as HTMLElement
      if (child.nodeType === 8) {
        // skip comments
        continue
      } else if (child.nodeType === 3) {
        // text node
        children.push(child.textContent)
      } else if (child.nodeName === 'TEMPLATE' && child.id.match(/(?:H|E):\d+/)) {
        const placeholderElement = document.createElement('hono-placeholder')
        placeholderElement.style.display = 'none'

        let resolve: (nodes: Node[]) => void
        const promise = new Promise<Node[]>((r) => (resolve = r))

        // Suspense: replace content by `replaceWith` when resolved
        // ErrorBoundary: replace content by `replaceWith` when error
        child.replaceWith = (node: DocumentFragment) => {
          resolve(createChildren(node.childNodes))
          placeholderElement.remove()
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: any = []

        // gather fallback content and find placeholder comment
        for (
          // equivalent to i++
          placeholderElement.appendChild(child);
          i < childNodes.length;
          i++
        ) {
          const child = childNodes[i]
          if (child.nodeType === 8) {
            // <!--/$--> or <!--E:1-->
            placeholderElement.appendChild(child)
            i--
            break
          } else if (child.nodeType === 3) {
            fallback.push(child.textContent)
          } else {
            fallback.push(
              createElement(child.nodeName, {
                children: createChildren(child.childNodes),
              })
            )
          }
        }

        // if already resolved or error, get content from added template element
        const fallbackTemplates = document.querySelectorAll<HTMLTemplateElement>(
          `[data-hono-target="${child.id}"]`
        )
        if (fallbackTemplates.length > 0) {
          const fallbackTemplate = fallbackTemplates[fallbackTemplates.length - 1]
          fallback = createChildren(fallbackTemplate.content.childNodes)
        }

        // if no content available, wait for ErrorBoundary fallback content
        if (fallback.length === 0 && child.id.startsWith('E:')) {
          let resolve: (nodes: Node[]) => void
          const promise = new Promise<Node[]>((r) => (resolve = r))
          fallback = createElement(Suspense, {
            fallback: [],
            children: [createElement(() => use(promise), {})],
          })
          placeholderElement.insertBefore = ((node: DocumentFragment) => {
            resolve(createChildren(node.childNodes))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any
        }

        // wait for content to be resolved by placeholderElement
        document.body.appendChild(placeholderElement)

        // render fallback content
        children.push(
          createElement(Suspense, {
            fallback,
            children: [createElement(() => use(promise), {})],
          })
        )
      } else {
        children.push(
          createElement(child.nodeName, {
            children: createChildren(child.childNodes),
          })
        )
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return children as any
  }

  return createChildren
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
            const createChildren =
              options?.createChildren ?? buildCreateChildrenFn(createElement as CreateElement)
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
