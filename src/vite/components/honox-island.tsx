import { createContext, useContext } from 'hono/jsx'
import { COMPONENT_NAME, DATA_SERIALIZED_PROPS, DATA_HONO_TEMPLATE } from '../../constants'

const inIsland = Symbol()
const inChildren = Symbol()
const IslandContext = createContext({
  [inIsland]: false,
  [inChildren]: false,
})

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
  const { children, ...rest } = props
  const islandState = useContext(IslandContext)
  return islandState[inChildren] || !islandState[inIsland] ? (
    // top-level or slot content
    <honox-island
      {...{ [COMPONENT_NAME]: componentName, [DATA_SERIALIZED_PROPS]: JSON.stringify(rest) }}
    >
      <IslandContext.Provider value={{ ...islandState, [inIsland]: true }}>
        <Component {...props} />
      </IslandContext.Provider>
      {children && (
        <template {...{ [DATA_HONO_TEMPLATE]: '' }}>
          <IslandContext.Provider value={{ ...islandState, [inChildren]: true }}>
            {children}
          </IslandContext.Provider>
        </template>
      )}
    </honox-island>
  ) : (
    // nested component
    <Component {...props} />
  )
}
