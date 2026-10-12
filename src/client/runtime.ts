import {
  COMPONENT_EXPORT,
  COMPONENT_NAME,
  DATA_HONO_TEMPLATE,
  DATA_SERIALIZED_PROPS,
} from '../constants.js'
import type { ClientRenderer, CreateChildren, HydrateComponent } from '../types.js'
import { isComment, isElement, isProperText, isTemplateElement } from './utils/dom.js'

type ImportComponent = (name: string, exportName?: string) => Promise<Function | undefined>

export const extractIslandTemplates = (island: Element) => {
  const templates: [string, HTMLTemplateElement][] = []

  for (const child of Array.from(island.children)) {
    if (!isTemplateElement(child)) continue
    const propKey = child.getAttribute(DATA_HONO_TEMPLATE)
    if (propKey === null) continue
    child.remove()
    templates.push([propKey, child])
  }

  return templates
}

export const buildCreateChildrenFn = <TElement = Node>(
  renderer: ClientRenderer<TElement>,
  importComponent: ImportComponent
): CreateChildren<TElement> => {
  const { createElement } = renderer
  let keyIndex = 0
  const createElementFromDom = async (element: Element): Promise<TElement> => {
    const children = await createChildren(element.childNodes)
    const props: Record<string, string> = {}
    const attributes = element.attributes
    for (let i = 0; i < attributes.length; i++) {
      props[attributes[i].name] = attributes[i].value
    }
    return createElement(element.nodeName, {
      key: ++keyIndex,
      children,
      ...props,
    })
  }
  const createChildren = async (
    childNodes: NodeListOf<ChildNode>
  ): Promise<(string | TElement)[]> => {
    const children: (string | TElement)[] = []
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i]
      if (isComment(child)) {
        continue
      } else if (isProperText(child)) {
        children.push(child.textContent)
      } else if (isTemplateElement(child) && child.id.match(/^(?:H|E):\d+$/)) {
        if (!renderer.suspense) {
          throw new Error('The renderer does not support streamed Suspense content')
        }
        const { component: Suspense, suspend } = renderer.suspense
        const placeholderElement = document.createElement('hono-placeholder')
        placeholderElement.style.display = 'none'

        let resolve: (nodes: (string | TElement)[]) => void
        const promise = new Promise<(string | TElement)[]>((r) => (resolve = r))

        // Suspense: replace content by `replaceWith` when resolved
        // ErrorBoundary: replace content by `replaceWith` when error
        child.replaceWith = (node: DocumentFragment) => {
          createChildren(node.childNodes).then(resolve)
          placeholderElement.remove()
        }

        let fallback: (string | TElement)[] = []

        // gather fallback content and find placeholder comment
        for (
          // equivalent to i++
          placeholderElement.appendChild(child);
          i < childNodes.length;
          i++
        ) {
          const child = childNodes[i]
          if (isComment(child)) {
            // <!--/$--> or <!--E:1-->
            placeholderElement.appendChild(child)
            i--
            break
          } else if (isProperText(child)) {
            fallback.push(child.textContent)
          } else if (isElement(child)) {
            fallback.push(await createElementFromDom(child))
          }
        }

        // if already resolved or error, get content from added template element
        const fallbackTemplates = document.querySelectorAll<HTMLTemplateElement>(
          `[data-hono-target="${child.id}"]`
        )
        if (fallbackTemplates.length > 0) {
          const fallbackTemplate = fallbackTemplates[fallbackTemplates.length - 1]
          fallback = await createChildren(fallbackTemplate.content.childNodes)
        }

        // if no content available, wait for ErrorBoundary fallback content
        if (fallback.length === 0 && child.id.startsWith('E:')) {
          let resolve: (nodes: (string | TElement)[]) => void
          const promise = new Promise<(string | TElement)[]>((r) => (resolve = r))
          fallback = [
            await createElement(Suspense, {
              fallback: [],
              children: [await createElement(() => suspend(promise), {})],
            }),
          ]
          placeholderElement.insertBefore = (node) => {
            createChildren(node.childNodes).then(resolve)
            return node
          }
        }

        // wait for content to be resolved by placeholderElement
        document.body.appendChild(placeholderElement)

        // render fallback content
        children.push(
          await createElement(Suspense, {
            fallback,
            children: [await createElement(() => suspend(promise), {})],
          })
        )
      } else if (isElement(child)) {
        const componentName = child.getAttribute(COMPONENT_NAME)
        if (!componentName) {
          children.push(await createElementFromDom(child))
          continue
        }

        const props = JSON.parse(child.getAttribute(DATA_SERIALIZED_PROPS) || '{}')
        const templates = extractIslandTemplates(child)

        const exportName = child.getAttribute(COMPONENT_EXPORT) || 'default'
        const component = await importComponent(componentName, exportName)
        if (!component) {
          throw new Error(
            `HonoX island component "${componentName}" export "${exportName}" was not found`
          )
        }
        for (const [propKey, template] of templates) {
          props[propKey] = await createChildren(template.content.childNodes)
        }
        children.push(
          await createElement(component, {
            key: ++keyIndex,
            ...props,
          })
        )
      }
    }
    return children
  }

  return createChildren
}

export const hydrateComponentHonoSuspense = async (hydrateComponent: HydrateComponent) => {
  const templates = new Set<Node>()
  const observerTargets = new Set<Element>()
  document.querySelectorAll('template[id^="H:"], template[id^="E:"]').forEach((template) => {
    if (template.parentElement) {
      templates.add(template)
      observerTargets.add(template.parentElement)
    }
  })

  if (observerTargets.size === 0) {
    return
  }

  const observer = new MutationObserver((mutations) => {
    const targets = new Set<Element>()
    mutations.forEach((mutation) => {
      if (mutation.target instanceof Element) {
        targets.add(mutation.target)
        mutation.removedNodes.forEach((node) => {
          templates.delete(node)
        })
      }
    })
    targets.forEach((target) => {
      hydrateComponent(target)
    })

    if (templates.size === 0) {
      // all templates have been hydrated
      observer.disconnect()
    }
  })
  observerTargets.forEach((target) => {
    observer.observe(target, { childList: true })
  })
}
