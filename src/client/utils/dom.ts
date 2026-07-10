export const isComment = (node: ChildNode | null | undefined): node is Comment =>
  node?.nodeType === Node.COMMENT_NODE

/**
 * Text excluding CDATASection (which also extends Text but has nodeType 4).
 * `textContent: string` is a workaround until TS 5.9.2 narrows it in lib.dom.
 */
export const isProperText = (
  node: ChildNode | null | undefined
): node is Text & { nodeType: 3; textContent: string } => node?.nodeType === Node.TEXT_NODE

export const isTemplateElement = (
  node: ChildNode | null | undefined
): node is HTMLTemplateElement => node?.nodeName === 'TEMPLATE'

export const isElement = (node: ChildNode | null | undefined): node is Element =>
  node?.nodeType === Node.ELEMENT_NODE
