import type * as BabelGenerator from '@babel/generator'
import { parse } from '@babel/parser'
import type * as BabelTraverse from '@babel/traverse'
import {
  blockStatement,
  conditionalExpression,
  exportDefaultDeclaration,
  exportNamedDeclaration,
  exportSpecifier,
  functionExpression,
  identifier,
  importDeclaration,
  importSpecifier,
  jsxAttribute,
  jsxClosingElement,
  jsxElement,
  jsxExpressionContainer,
  jsxIdentifier,
  jsxOpeningElement,
  jsxSpreadAttribute,
  memberExpression,
  metaProperty,
  returnStatement,
  stringLiteral,
  variableDeclaration,
  variableDeclarator,
} from '@babel/types'
import { normalizePath } from 'vite'
import type { Plugin } from 'vite'
import { createRequire } from 'node:module'
import path from 'path'
import { isComponentName, matchIslandComponentId } from './utils/path.js'

const require = createRequire(import.meta.url)
const generate: typeof BabelGenerator.default = require('@babel/generator').default
const traverse: typeof BabelTraverse.default = require('@babel/traverse').default

function addSSRCheck(funcName: string, componentName: string, componentExport?: string) {
  const isSSR = memberExpression(
    memberExpression(metaProperty(identifier('import'), identifier('meta')), identifier('env')),
    identifier('SSR')
  )

  const props = [
    jsxAttribute(jsxIdentifier('componentName'), stringLiteral(componentName)),
    jsxAttribute(jsxIdentifier('Component'), jsxExpressionContainer(identifier(funcName))),
    jsxAttribute(jsxIdentifier('props'), jsxExpressionContainer(identifier('props'))),
  ]
  if (componentExport && componentExport !== 'default') {
    props.push(jsxAttribute(jsxIdentifier('componentExport'), stringLiteral(componentExport)))
  }

  const ssrElement = jsxElement(
    jsxOpeningElement(jsxIdentifier('HonoXIsland'), props, true),
    null,
    []
  )

  const clientElement = jsxElement(
    jsxOpeningElement(jsxIdentifier(funcName), [jsxSpreadAttribute(identifier('props'))], false),
    jsxClosingElement(jsxIdentifier(funcName)),
    []
  )

  const returnStmt = returnStatement(conditionalExpression(isSSR, ssrElement, clientElement))
  return functionExpression(null, [identifier('props')], blockStatement([returnStmt]))
}

export const transformJsxTags = (contents: string, componentName: string) => {
  const ast = parse(contents, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })

  if (ast) {
    let isTransformed = false

    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (path.node.declaration?.type === 'FunctionDeclaration') {
          // transform `export function NamedFunction() {}`
          const name = path.node.declaration.id?.name
          if (name && isComponentName(name)) {
            path.insertBefore(path.node.declaration)
            path.replaceWith(
              exportNamedDeclaration(null, [exportSpecifier(identifier(name), identifier(name))])
            )
          }
          return
        }

        if (path.node.declaration?.type === 'VariableDeclaration') {
          // transform `export const NamedFunction = () => {}`
          const kind = path.node.declaration.kind
          for (const declaration of path.node.declaration.declarations) {
            if (declaration.id.type === 'Identifier') {
              const name = declaration.id.name
              if (!isComponentName(name)) {
                continue
              }
              path.insertBefore(variableDeclaration(kind, [declaration]))
              path.insertBefore(
                exportNamedDeclaration(null, [exportSpecifier(identifier(name), identifier(name))])
              )
              path.remove()
            }
          }
          return
        }

        for (const specifier of path.node.specifiers) {
          if (specifier.type !== 'ExportSpecifier') {
            continue
          }
          const exportAs =
            specifier.exported.type === 'StringLiteral'
              ? specifier.exported.value
              : specifier.exported.name
          if (exportAs !== 'default' && !isComponentName(exportAs)) {
            continue
          }
          isTransformed = true

          const wrappedFunction = addSSRCheck(specifier.local.name, componentName, exportAs)
          const wrappedFunctionId = identifier('Wrapped' + specifier.local.name)
          path.insertBefore(
            variableDeclaration('const', [variableDeclarator(wrappedFunctionId, wrappedFunction)])
          )

          specifier.local.name = wrappedFunctionId.name
        }
      },
      ExportDefaultDeclaration(path) {
        const declarationType = path.node.declaration.type
        if (
          declarationType === 'FunctionDeclaration' ||
          declarationType === 'FunctionExpression' ||
          declarationType === 'ArrowFunctionExpression' ||
          declarationType === 'Identifier'
        ) {
          isTransformed = true

          const functionName =
            (declarationType === 'Identifier'
              ? path.node.declaration.name
              : (declarationType === 'FunctionDeclaration' ||
                  declarationType === 'FunctionExpression') &&
                path.node.declaration.id?.name) || '__HonoIsladComponent__'

          let originalFunctionId
          if (declarationType === 'Identifier') {
            originalFunctionId = path.node.declaration
          } else {
            originalFunctionId = identifier(functionName + 'Original')

            const originalFunction =
              path.node.declaration.type === 'FunctionExpression' ||
              path.node.declaration.type === 'ArrowFunctionExpression'
                ? path.node.declaration
                : functionExpression(
                    null,
                    path.node.declaration.params,
                    path.node.declaration.body,
                    undefined,
                    path.node.declaration.async
                  )

            path.insertBefore(
              variableDeclaration('const', [
                variableDeclarator(originalFunctionId, originalFunction),
              ])
            )
          }

          const wrappedFunction = addSSRCheck(originalFunctionId.name, componentName)
          const wrappedFunctionId = identifier('Wrapped' + functionName)
          path.replaceWith(
            variableDeclaration('const', [variableDeclarator(wrappedFunctionId, wrappedFunction)])
          )
          ast.program.body.push(exportDefaultDeclaration(wrappedFunctionId))
        }
      },
    })

    if (isTransformed) {
      ast.program.body.unshift(
        importDeclaration(
          [importSpecifier(identifier('HonoXIsland'), identifier('HonoXIsland'))],
          stringLiteral('honox/vite/components')
        )
      )
    }

    const { code } = generate(ast)
    return code
  }
}

type IsIsland = (id: string) => boolean
export type IslandComponentsOptions = {
  /**
   * @deprecated
   */
  isIsland?: IsIsland
  islandDir?: string
}

export function islandComponents(options?: IslandComponentsOptions): Plugin {
  let root = ''
  const islandDir = options?.islandDir ?? '/app/islands'
  return {
    name: 'transform-island-components',
    apply: (_config, { command, mode }) => command !== 'build' || mode !== 'client',
    enforce: 'pre',
    configResolved: (config) => {
      root = config.root
    },

    /** Transform island source before renderer-specific JSX plugins run. */
    transform(contents, id, { ssr } = {}) {
      if (!ssr) return
      const fileId = id.split('?')[0]
      const rootPath = `/${normalizePath(path.relative(root, fileId))}`
      const match = matchIslandComponentId(rootPath, islandDir)
      if (match) {
        const componentName = match[0]
        const code = transformJsxTags(contents, componentName)
        if (code) {
          return {
            code,
            map: null,
          }
        }
      }
    },
  }
}
