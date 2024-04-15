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
  callExpression,
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
} from '@babel/types'
// eslint-disable-next-line node/no-extraneous-import
import type { Plugin } from 'vite'
import { COMPONENT_NAME, DATA_HONO_TEMPLATE, DATA_SERIALIZED_PROPS } from '../constants.js'

function addSSRCheck(funcName: string, componentName: string) {
  const isSSR = memberExpression(
    memberExpression(identifier('import'), identifier('meta')),
    identifier('env.SSR')
  )

  // serialize props by excluding the children
  const serializedProps = callExpression(identifier('JSON.stringify'), [
    callExpression(memberExpression(identifier('Object'), identifier('fromEntries')), [
      callExpression(
        memberExpression(
          callExpression(memberExpression(identifier('Object'), identifier('entries')), [
            identifier('props'),
          ]),
          identifier('filter')
        ),
        [identifier('([key]) => key !== "children"')]
      ),
    ]),
  ])

  const ssrElement = jsxElement(
    jsxOpeningElement(
      jsxIdentifier('honox-island'),
      [
        jsxAttribute(jsxIdentifier(COMPONENT_NAME), stringLiteral(componentName)),
        jsxAttribute(jsxIdentifier(DATA_SERIALIZED_PROPS), jsxExpressionContainer(serializedProps)),
      ],
      false
    ),
    jsxClosingElement(jsxIdentifier('honox-island')),
    [
      jsxElement(
        jsxOpeningElement(
          jsxIdentifier(funcName),
          [jsxSpreadAttribute(identifier('props'))],
          false
        ),
        jsxClosingElement(jsxIdentifier(funcName)),
        []
      ),
      jsxExpressionContainer(
        conditionalExpression(
          memberExpression(identifier('props'), identifier('children')),
          jsxElement(
            jsxOpeningElement(
              jsxIdentifier('template'),
              [jsxAttribute(jsxIdentifier(DATA_HONO_TEMPLATE), stringLiteral(''))],
              false
            ),
            jsxClosingElement(jsxIdentifier('template')),
            [jsxExpressionContainer(memberExpression(identifier('props'), identifier('children')))]
          ),
          identifier('null')
        )
      ),
    ]
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
    let wrappedFunctionId

    traverse(ast, {
      ExportNamedDeclaration(path) {
        for (const specifier of path.node.specifiers) {
          if (specifier.type !== 'ExportSpecifier') {
            continue
          }
          const exportAs =
            specifier.exported.type === 'StringLiteral'
              ? specifier.exported.value
              : specifier.exported.name
          if (exportAs !== 'default') {
            continue
          }

          const wrappedFunction = addSSRCheck(specifier.local.name, componentName)
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
          wrappedFunctionId = identifier('Wrapped' + functionName)
          path.replaceWith(
            variableDeclaration('const', [variableDeclarator(wrappedFunctionId, wrappedFunction)])
          )
        }
      },
    })

    if (wrappedFunctionId) {
      ast.program.body.push(exportDefaultDeclaration(wrappedFunctionId))
    }

    const { code } = generate(ast)
    return code
  }
}

type IsIsland = (id: string) => boolean
export type IslandComponentsOptions = {
  isIsland: IsIsland
}

function getIslandComponentName(
  root: string,
  id: string,
  options?: IslandComponentsOptions
): string | null {
  const defaultIsIsland: IsIsland = (id) => {
    const islandDirectoryPath = path.join(root, 'app')
    return path.resolve(id).startsWith(islandDirectoryPath)
  }
  const matchIslandPath = options?.isIsland ?? defaultIsIsland
  if (!matchIslandPath(id)) {
    return null
  }
  const match = id.match(/(\/islands\/.+?\.tsx$)|(\/routes\/.*\_[a-zA-Z0-9[-]+\.island\.tsx$)/)
  if (!match) {
    return null
  }
  return match[0]
}

export function islandComponents(options?: IslandComponentsOptions): Plugin {
  let root = ''
  return {
    name: 'transform-island-components',
    enforce: 'pre',
    configResolved: (config) => {
      root = config.root
    },
    async resolveId(source, importer) {
      const resolution = await this.resolve(source, importer)
      if (resolution && importer && getIslandComponentName(root, importer, options)) {
        return `${resolution.id}?no-island`
      }
    },
    async load(id) {
      if (id.endsWith('?no-island')) {
        return
      }
      const componentName = getIslandComponentName(root, id, options)
      if (componentName) {
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
