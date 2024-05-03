import { createContext, useContext, isValidElement } from 'hono/jsx'
import { COMPONENT_NAME, DATA_SERIALIZED_PROPS, DATA_HONO_TEMPLATE } from '../../constants'

const inIsland = Symbol()
const inChildren = Symbol()
const IslandContext = createContext({
  [inIsland]: false,
  [inChildren]: false,
})

const isElementPropValue = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.some(isElementPropValue)
    : typeof value === 'object' && isValidElement(value)

export const HonoXIsland = ({
  componentName,
  Component,
  props,
}: {
  componentName: string
  Component: Function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elementProps: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restProps: Record<string, any> = {}
  for (const key in props) {
    const value = props[key]
    if (isElementPropValue(value)) {
      elementProps[key] = value
    } else {
      restProps[key] = value
    }
  }

  const islandState = useContext(IslandContext)
  return islandState[inChildren] || !islandState[inIsland] ? (
    // top-level or slot content
    <honox-island
      {...{ [COMPONENT_NAME]: componentName, [DATA_SERIALIZED_PROPS]: JSON.stringify(restProps) }}
    >
      <IslandContext.Provider value={{ ...islandState, [inIsland]: true }}>
        <Component {...props} />
      </IslandContext.Provider>
      {Object.entries(elementProps).map(([key, children]) => (
        <template {...{ [DATA_HONO_TEMPLATE]: key }}>
          <IslandContext.Provider value={{ ...islandState, [inChildren]: true }}>
            {children}
          </IslandContext.Provider>
        </template>
      ))}
    </honox-island>
  ) : (
    // nested component
    <Component {...props} />
  )
}
