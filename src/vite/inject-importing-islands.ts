import _generate from '@babel/generator'
import { parse } from '@babel/parser'
import type { Statement } from '@babel/types'
import dependencyTree from 'dependency-tree'
import type { Plugin } from 'vite'
import { IMPORTING_ISLANDS_ID } from '../constants.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate

export function injectImportingIslands(): Plugin {
  const visited = {}
  const regex = new RegExp(/\\islands\\/)

  return {
    name: 'inject-importing-islands',
    transform(code, id) {
      if (id.endsWith('.tsx') || id.endsWith('.jsx')) {
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['jsx'],
        })

        const hasIslandsImport = dependencyTree
          .toList({
            filename: id,
            directory: '.',
            visited,
          })
          .some((x) => regex.test(x))

        if (hasIslandsImport) {
          const hasIslandsNode: Statement = {
            type: 'ExportNamedDeclaration',
            specifiers: [],
            declaration: {
              type: 'VariableDeclaration',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: IMPORTING_ISLANDS_ID },
                  init: { type: 'BooleanLiteral', value: true },
                },
              ],
              kind: 'const',
            },
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ast.program.body.push(hasIslandsNode)
        }

        const output = generate(ast, {}, code)
        return {
          code: output.code,
          map: output.map,
        }
      }
    },
  }
}
