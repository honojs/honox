import * as pathLib from 'node:path'
import _generate from '@babel/generator'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import type { Plugin } from 'vite'
import { IMPORTING_ISLANDS_ID } from '../constants.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const traverse = (_traverse.default as typeof _traverse) ?? _traverse
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate

export function injectImportingIslands(): Plugin {
  return {
    name: 'inject-importing-islands',
    transform(code, id) {
      if (id.endsWith('.tsx') || id.endsWith('.jsx')) {
        let hasIslandsImport = false
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['jsx'],
        })

        traverse(ast, {
          ImportDeclaration(path) {
            // We have to make a note that `../components/islands/foo.tsx` is also a target.
            if (path.node.source.value.includes('islands/')) {
              hasIslandsImport = true
            }

            // RPC
            ;(() => {
              const specifier = path.node.specifiers[0]
              if (specifier.type !== 'ImportDefaultSpecifier') {
                return
              }
              const importName = specifier.local.name
              if (!importName.startsWith('$')) {
                return
              }
              if (!path.node.source.value.includes('routes/')) {
                return
              }
              const importPath = pathLib.resolve(pathLib.dirname(id), path.node.source.value)
              path.node.source.value = `virtual:honox-rpc?${importPath}`
            })()
          },
        })

        if (hasIslandsImport) {
          const hasIslandsNode = {
            type: 'ExportNamedDeclaration',
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
          ast.program.body.push(hasIslandsNode as any)
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
