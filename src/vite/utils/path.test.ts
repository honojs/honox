import { matchIslandComponentId } from './path'

describe('matchIslandComponentId', () => {
  describe('match', () => {
    const paths = [
      '/islands/counter.tsx',
      '/islands/directory/counter.tsx',
      '/routes/$counter.tsx',
      '/routes/directory/$counter.tsx',
      '/routes/_counter.island.tsx',
      '/routes/directory/_counter.island.tsx',
      '/$counter.tsx',
      '/directory/$counter.tsx',
      '/_counter.island.tsx',
      '/directory/_counter.island.tsx',
    ]

    paths.forEach((path) => {
      it(`Should match ${path}`, () => {
        const match = matchIslandComponentId(path)
        expect(match).not.toBeNull()
        expect(match![0]).toBe(path)
      })
    })
  })

  describe('not match', () => {
    const paths = [
      '/routes/directory/component.tsx',
      '/routes/directory/foo$component.tsx',
      '/routes/directory/foo_component.island.tsx',
      '/routes/directory/component.island.tsx',
    ]

    paths.forEach((path) => {
      it(`Should not match ${path}`, () => {
        const match = matchIslandComponentId(path)
        expect(match).toBeNull()
      })
    })
  })
})
