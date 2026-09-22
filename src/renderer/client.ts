import { Suspense, createElement, render, use } from 'hono/jsx/dom'
import type { JSXNode } from 'hono/jsx/dom'
import type { ClientRenderer } from '../types.js'

const renderer: ClientRenderer<JSXNode> = {
  createElement,
  hydrateRoot: (element, parent) => render(element, parent),
  suspense: { component: Suspense, suspend: use },
}

export default renderer
