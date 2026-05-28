/* eslint-disable @typescript-eslint/no-explicit-any */

/** JSX */
export type CreateElement<E = Node> = (type: any, props: any) => E | Promise<E>
export type Hydrate<E = Node> = (children: E, parent: Element) => void | Promise<void>
export type CreateChildren<E = Node> = (childNodes: NodeListOf<ChildNode>) => E[] | Promise<E[]>
export type HydrateComponent = (doc: {
  querySelectorAll: typeof document.querySelectorAll
}) => Promise<void>
export type TriggerHydration = (trigger: HydrateComponent) => void
