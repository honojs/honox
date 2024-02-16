import {
  filePathToPath,
  groupByDirectory,
  listByDirectory,
  pathToDirectoryPath,
  sortDirectoriesByDepth,
} from '../../../src/utils/file.js'

describe('filePathToPath', () => {
  it('Should return a correct path', () => {
    expect(filePathToPath('index.tsx')).toBe('/')
    expect(filePathToPath('index.get.tsx')).toBe('/index.get')
    expect(filePathToPath('about.tsx')).toBe('/about')
    expect(filePathToPath('about/index.tsx')).toBe('/about')
    expect(filePathToPath('about/me')).toBe('/about/me')
    expect(filePathToPath('about/me/index.tsx')).toBe('/about/me')
    expect(filePathToPath('about/me/address.tsx')).toBe('/about/me/address')

    expect(filePathToPath('/index.tsx')).toBe('/')
    expect(filePathToPath('/index.get.tsx')).toBe('/index.get')
    expect(filePathToPath('/about.tsx')).toBe('/about')
    expect(filePathToPath('/about/index.tsx')).toBe('/about')
    expect(filePathToPath('/about/me')).toBe('/about/me')
    expect(filePathToPath('/about/me/index.tsx')).toBe('/about/me')
    expect(filePathToPath('/about/me/address.tsx')).toBe('/about/me/address')

    expect(filePathToPath('/about/[name].tsx')).toBe('/about/:name')
    expect(filePathToPath('/about/[...foo].tsx')).toBe('/about/*')
    expect(filePathToPath('/about/[name]/address.tsx')).toBe('/about/:name/address')
    expect(filePathToPath('/about/[arg1]/[arg2]')).toBe('/about/:arg1/:arg2')
  })
})

describe('groupByDirectory', () => {
  const files = {
    '/app/routes/index.tsx': 'file1',
    '/app/routes/about.tsx': 'file2',
    '/app/routes/blog/index.tsx': 'file3',
    '/app/routes/blog/about.tsx': 'file4',
    '/app/routes/blog/posts/index.tsx': 'file5',
    '/app/routes/blog/posts/comments.tsx': 'file6',
  }

  it('Should group by directories', () => {
    expect(groupByDirectory(files)).toEqual({
      '/app/routes': {
        'index.tsx': 'file1',
        'about.tsx': 'file2',
      },
      '/app/routes/blog': {
        'index.tsx': 'file3',
        'about.tsx': 'file4',
      },
      '/app/routes/blog/posts': {
        'index.tsx': 'file5',
        'comments.tsx': 'file6',
      },
    })
  })
})

describe('sortDirectoriesByDepth', () => {
  it('Should sort directories by the depth', () => {
    expect(
      sortDirectoriesByDepth({
        '/app/routes': {
          'index.tsx': 'file1',
        },
        '/app/routes/blog/posts': {
          'index.tsx': 'file2',
        },
        '/app/routes/blog': {
          'index.tsx': 'file3',
        },
      })
    ).toEqual([
      {
        '/app/routes/blog/posts': {
          'index.tsx': 'file2',
        },
      },
      {
        '/app/routes/blog': {
          'index.tsx': 'file3',
        },
      },
      {
        '/app/routes': {
          'index.tsx': 'file1',
        },
      },
    ])
  })
})

describe('listByDirectory', () => {
  it('Should list files by their directory', () => {
    const files = {
      '/app/routes/blog/posts/_renderer.tsx': 'foo3',
      '/app/routes/_renderer.tsx': 'foo',
      '/app/routes/blog/_renderer.tsx': 'foo2',
    }

    const result = listByDirectory(files)

    expect(result).toEqual({
      '/app/routes': ['/app/routes/_renderer.tsx'],
      '/app/routes/blog': ['/app/routes/blog/_renderer.tsx', '/app/routes/_renderer.tsx'],
      '/app/routes/blog/posts': [
        '/app/routes/blog/posts/_renderer.tsx',
        '/app/routes/blog/_renderer.tsx',
        '/app/routes/_renderer.tsx',
      ],
    })
  })
})

describe('pathToDirectoryPath', () => {
  it('Should return the directory path', () => {
    expect(pathToDirectoryPath('/')).toBe('/')
    expect(pathToDirectoryPath('/about.tsx')).toBe('/')
    expect(pathToDirectoryPath('/posts/index.tsx')).toBe('/posts/')
    expect(pathToDirectoryPath('/posts/authors/index.tsx')).toBe('/posts/authors/')
  })
})
