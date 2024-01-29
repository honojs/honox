import fs from 'fs/promises'
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
import { COMPONENT_NAME, DATA_SERIALIZED_PROPS } from '../constants.js'

function addSSRCheck(funcName: string, componentName: string, isAsync = false) {
  const isSSR = memberExpression(
    memberExpression(identifier('import'), identifier('meta')),
    identifier('env.SSR')
  )

  const serializedProps = callExpression(identifier('JSON.stringify'), [identifier('props')])

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
    ]
  )

  const clientElement = jsxElement(
    jsxOpeningElement(jsxIdentifier(funcName), [jsxSpreadAttribute(identifier('props'))], false),
    jsxClosingElement(jsxIdentifier(funcName)),
    []
  )

  const returnStmt = returnStatement(conditionalExpression(isSSR, ssrElement, clientElement))
  const functionExpr = functionExpression(null, [identifier('props')], blockStatement([returnStmt]))
  if (isAsync) {
    functionExpr.async = true
  }
  return functionExpr
}

export const transformJsxTags = (contents: string, componentName: string) => {
  const ast = parse(contents, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })

  if (ast) {
    traverse(ast, {
      ExportDefaultDeclaration(path) {
        if (path.node.declaration.type === 'FunctionDeclaration') {
          const functionId = path.node.declaration.id
          if (!functionId) {
            return
          }
          const isAsync = path.node.declaration.async
          const originalFunctionId = identifier(functionId.name + 'Original')

          const originalFunction = functionExpression(
            null,
            path.node.declaration.params,
            path.node.declaration.body
          )
          if (isAsync) {
            originalFunction.async = true
          }

          path.insertBefore(
            variableDeclaration('const', [variableDeclarator(originalFunctionId, originalFunction)])
          )

          const wrappedFunction = addSSRCheck(originalFunctionId.name, componentName, isAsync)
          const wrappedFunctionId = identifier('Wrapped' + functionId.name)
          path.replaceWith(
            variableDeclaration('const', [variableDeclarator(wrappedFunctionId, wrappedFunction)])
          )
          path.insertAfter(exportDefaultDeclaration(wrappedFunctionId))
        }
      },
    })

    const { code } = generate(ast)
    return code
  }
}

export function islandComponents(): Plugin {
  return {
    name: 'transform-island-components',
    async load(id) {
      const match = id.match(/\/islands\/(.+?\.tsx)$/)
      if (match) {
        const componentName = match[1]
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
