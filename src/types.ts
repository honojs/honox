/* eslint-disable @typescript-eslint/no-explicit-any */

/** JSX */
export type CreateElement = (type: any, props: any) => Node | Promise<Node>
export type Hydrate = (children: Node, parent: Element) => void | Promise<void>
export type CreateChildren = (childNodes: NodeListOf<ChildNode>) => Node[] | Promise<Node[]>
