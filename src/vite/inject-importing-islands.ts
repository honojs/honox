import _generate from '@babel/generator'
import { parse } from '@babel/parser'
import { exportNamedDeclaration, variableDeclaration, variableDeclarator } from '@babel/types'
import dependencyTree from 'dependency-tree'
import { normalizePath, type Plugin } from 'vite'
import { IMPORTING_ISLANDS_ID } from '../constants.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate

export function injectImportingIslands(): Plugin {
  const visited = {}
  const isIslandRegex = new RegExp(/\/islands\//)
  const fileExtensionRegex = new RegExp(/routes\/.*\.[t|j]sx$/)

  return {
    name: 'inject-importing-islands',
    transform(sourceCode, id) {
      if (!fileExtensionRegex.test(id)) {
        return
      }

      const hasIslandsImport = dependencyTree
        .toList({
          filename: id,
          directory: '.',
          visited,
        })
        .some((x) => isIslandRegex.test(normalizePath(x)))

      if (!hasIslandsImport) {
        return
      }

      const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['jsx'],
      })
      ast.program.body.push(
        exportNamedDeclaration(
          variableDeclaration('const', [
            variableDeclarator(
              { type: 'Identifier', name: IMPORTING_ISLANDS_ID },
              { type: 'BooleanLiteral', value: true }
            ),
          ])
        )
      )

      return generate(ast)
    },
  }
}
