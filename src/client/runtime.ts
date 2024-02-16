import { Suspense, use } from 'hono/jsx/dom'
import type { CreateElement, CreateChildren } from '../types.js'

export const buildCreateChildrenFn = (createElement: CreateElement): CreateChildren => {
  const createChildren = async (childNodes: NodeListOf<ChildNode>): Promise<Node[]> => {
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
          createChildren(node.childNodes).then(resolve)
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
              await createElement(child.nodeName, {
                children: await createChildren(child.childNodes),
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
          fallback = await createChildren(fallbackTemplate.content.childNodes)
        }

        // if no content available, wait for ErrorBoundary fallback content
        if (fallback.length === 0 && child.id.startsWith('E:')) {
          let resolve: (nodes: Node[]) => void
          const promise = new Promise<Node[]>((r) => (resolve = r))
          fallback = await createElement(Suspense, {
            fallback: [],
            children: [await createElement(() => use(promise), {})],
          })
          placeholderElement.insertBefore = ((node: DocumentFragment) => {
            createChildren(node.childNodes).then(resolve)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any
        }

        // wait for content to be resolved by placeholderElement
        document.body.appendChild(placeholderElement)

        // render fallback content
        children.push(
          await createElement(Suspense, {
            fallback,
            children: [await createElement(() => use(promise), {})],
          })
        )
      } else {
        children.push(
          await createElement(child.nodeName, {
            children: await createChildren(child.childNodes),
          })
        )
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return children as any
  }

  return createChildren
}
