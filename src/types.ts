/** JSX */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CreateElement<E = Node> = (type: any, props: any) => E | Promise<E>
export type Hydrate<E = Node> = (children: E, parent: Element) => void | Promise<void>
export type CreateChildren<E = Node> = (
  childNodes: NodeListOf<ChildNode>
) => (string | E)[] | Promise<(string | E)[]>
export type HydrateComponent = (doc: {
  querySelectorAll: typeof document.querySelectorAll
}) => Promise<void>
export type TriggerHydration = (trigger: HydrateComponent) => void
