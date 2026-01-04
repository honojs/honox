import { filterByPattern } from './filter'

describe('filterByPattern', () => {
  it('Should filter files by regex patterns', () => {
    const files = {
      '/app/islands/Counter.tsx': 'counter',
      '/app/islands/_hidden.tsx': 'hidden',
      '/app/components/_Badge.island.tsx': 'badge',
      '/app/routes/$id.tsx': 'id',
    }
    const patterns = [
      /\/[a-zA-Z0-9-]+\.tsx$/,
      /\/_[a-zA-Z0-9-]+\.island\.tsx$/,
      /\/\$[a-zA-Z0-9-]+\.tsx$/,
    ]

    expect(filterByPattern(files, patterns)).toEqual({
      '/app/islands/Counter.tsx': 'counter',
      '/app/components/_Badge.island.tsx': 'badge',
      '/app/routes/$id.tsx': 'id',
    })
  })
})
