import {
  COMPONENT_NAME,
  COMPONENT_EXPORT,
  DATA_SERIALIZED_PROPS,
  DATA_HONO_TEMPLATE,
} from '../../constants'
import { createIslandRoot, getServerRenderer } from '../../server/renderer-context.js'
import type { ServerIslandRootProps } from '../../types.js'

const DATA_HONO_ROOT = 'data-hono-root'

const isElementPropValue = (value: unknown, isElement: (value: unknown) => boolean): boolean =>
  Array.isArray(value)
    ? value.some((item) => isElementPropValue(item, isElement))
    : isElement(value)

export const HonoXIsland = ({
  componentName,
  componentExport,
  Component,
  props,
}: {
  componentName: string
  componentExport?: string
  Component: Function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any
  // Renderer-specific JSX values intentionally meet at this boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any => {
  const { createElement, island, isElement, renderRoot } = getServerRenderer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elementProps: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restProps: Record<string, any> = {}
  for (const key in props) {
    const value = props[key]
    if (isElementPropValue(value, isElement)) {
      elementProps[key] = value
    } else {
      restProps[key] = value
    }
  }

  const islandState = island.useState()
  if (islandState.inIsland && !islandState.inChildren) {
    return createElement(Component, props)
  }

  const root = createIslandRoot()
  const rendered = renderRoot(
    () => island.wrap(() => createElement(Component, props), { ...islandState, inIsland: true }),
    () =>
      Object.entries(elementProps).map(([key, children]) =>
        createElement('template', {
          [DATA_HONO_TEMPLATE]: key,
          key,
          children: island.wrap(() => children, { ...islandState, inChildren: true }),
        })
      ),
    root
  )

  const renderIsland = (rootProps: ServerIslandRootProps) =>
    createElement('honox-island', {
      ...rootProps,
      key: root.id,
      [COMPONENT_NAME]: componentName,
      [COMPONENT_EXPORT]: componentExport || undefined,
      [DATA_SERIALIZED_PROPS]: JSON.stringify(restProps),
      [DATA_HONO_ROOT]: root.id,
    })

  return rendered instanceof Promise ? rendered.then(renderIsland) : renderIsland(rendered)
}
