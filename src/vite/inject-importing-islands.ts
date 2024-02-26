import _generate from '@babel/generator'
import { parse } from '@babel/parser'
import { exportNamedDeclaration, variableDeclaration, variableDeclarator } from '@babel/types'
import dependencyTree from 'dependency-tree'
import type { Plugin } from 'vite'
import { IMPORTING_ISLANDS_ID } from '../constants.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate

export function injectImportingIslands(): Plugin {
  const visited = {}
  const isIslandRegex = new RegExp(/\\islands\\/)
  const fileExtensionRegex = new RegExp(/\.[t|j]sx$/)

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
        .some((x) => isIslandRegex.test(x))

      if (!hasIslandsImport) {
        return
      }

      const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['jsx'],
      })
      ast.program.body.push(hasIslandsNode)

      return generate(ast, {}, sourceCode)
    },
  }
}

const hasIslandsNode = exportNamedDeclaration(
  variableDeclaration('const', [
    variableDeclarator(
      { type: 'Identifier', name: IMPORTING_ISLANDS_ID },
      { type: 'BooleanLiteral', value: true }
    ),
  ])
)
