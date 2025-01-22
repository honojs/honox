import { ensureTrailngSlash } from './path'

describe('ensureTrailngSlash', () => {
  it('Should ensure trailing slash', () => {
    expect(ensureTrailngSlash('./')).toBe('./')
    expect(ensureTrailngSlash('/')).toBe('/')
    expect(ensureTrailngSlash('/subdir')).toBe('/subdir/')
    expect(ensureTrailngSlash('/subdir/')).toBe('/subdir/')
    expect(ensureTrailngSlash('https://example.com')).toBe('https://example.com/')
    expect(ensureTrailngSlash('https://example.com/subdir')).toBe('https://example.com/subdir/')
  })
})
