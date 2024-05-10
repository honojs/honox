import fs from 'fs/promises'
import path from 'path'
import _generate from '@babel/generator'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const traverse = (_traverse.default as typeof _traverse) ?? _traverse
import {
  identifier,
  jsxAttribute,
  jsxClosingElement,
  jsxElement,
  jsxIdentifier,
  jsxOpeningElement,
  stringLiteral,
  variableDeclarator,
  variableDeclaration,
  functionExpression,
  blockStatement,
  returnStatement,
  jsxSpreadAttribute,
  jsxExpressionContainer,
  exportDefaultDeclaration,
  conditionalExpression,
  memberExpression,
  importDeclaration,
  importSpecifier,
  exportNamedDeclaration,
  exportSpecifier,
} from '@babel/types'
import { parse as parseJsonc } from 'jsonc-parser'
// eslint-disable-next-line node/no-extraneous-import
import type { Plugin } from 'vite'

/**
 * Check if the name is a valid component name
 *
 * @param name - The name to check
 * @returns true if the name is a valid component name
 * @example
 * isComponentName('Badge') // true
 * isComponentName('BadgeComponent') // true
 * isComponentName('badge') // false
 * isComponentName('MIN') // false
 * isComponentName('Badge_Component') // false
 */
function isComponentName(name: string) {
  return /^[A-Z][A-Z0-9]*[a-z][A-Za-z0-9]*$/.test(name)
}

/**
 * Matches when id is the filename of Island component
 *
 * @param id - The id to match
 * @returns The result object if id is matched or null
 */
export function matchIslandComponentId(id: string) {
  return id.match(
    /\/islands\/.+?\.tsx$|\/routes\/(?:.*\/)?(?:\_[a-zA-Z0-9-]+\.island\.tsx$|\$[a-zA-Z0-9-]+\.tsx$)/
  )
}

function addSSRCheck(funcName: string, componentName: string, componentExport?: string) {
  const isSSR = memberExpression(
    memberExpression(identifier('import'), identifier('meta')),
    identifier('env.SSR')
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
  isIsland?: IsIsland
  reactApiImportSource?: string
}

export function islandComponents(options?: IslandComponentsOptions): Plugin {
  let root = ''
  let reactApiImportSource = options?.reactApiImportSource
  return {
    name: 'transform-island-components',
    configResolved: async (config) => {
      root = config.root

      if (!reactApiImportSource) {
        const tsConfigPath = path.resolve(process.cwd(), 'tsconfig.json')
        try {
          const tsConfigRaw = await fs.readFile(tsConfigPath, 'utf8')
          const tsConfig = parseJsonc(tsConfigRaw)

          reactApiImportSource = tsConfig.compilerOptions?.jsxImportSource
          if (reactApiImportSource === 'hono/jsx/dom') {
            reactApiImportSource = 'hono/jsx' // we should use hono/jsx instead of hono/jsx/dom
          }
        } catch (error) {
          console.warn('Error reading tsconfig.json:', error)
        }
      }
    },

    async load(id) {
      if (/\/honox\/.*?\/(?:server|vite)\/components\//.test(id)) {
        if (!reactApiImportSource) {
          return
        }
        const contents = await fs.readFile(id, 'utf-8')
        return {
          code: contents.replaceAll('hono/jsx', reactApiImportSource),
          map: null,
        }
      }

      const defaultIsIsland: IsIsland = (id) => {
        const islandDirectoryPath = path.join(root, 'app')
        return path.resolve(id).startsWith(islandDirectoryPath)
      }
      const matchIslandPath = options?.isIsland ?? defaultIsIsland
      if (!matchIslandPath(id)) {
        return
      }
      const match = matchIslandComponentId(id)
      if (match) {
        const componentName = match[0]
        const contents = await fs.readFile(id, 'utf-8')
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
