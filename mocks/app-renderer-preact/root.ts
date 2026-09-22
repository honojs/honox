import type { VNode } from 'preact'

type RootVNode = VNode & {
  // Preact has no public per-root ID prefix API, so seed the internal useId state.
  _mask?: [string, number]
  __m?: [string, number]
}

export const seedRoot = <T extends VNode>(vnode: T, id: string): T => {
  const mask: [string, number] = [id, 0]
  const root = vnode as RootVNode
  root._mask = mask
  root.__m = mask
  return vnode
}
