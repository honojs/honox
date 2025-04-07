export const filePathToPath = (filePath: string) => {
  filePath = filePath
    .replace(/\.tsx?$/g, '')
    .replace(/\.mdx?$/g, '')
    .replace(/^\/?index$/, '/') // `/index`
    .replace(/\/index$/, '') // `/about/index`
    .replace(/\[\.{3}.+\]/, '*')
    .replace(/\((.+?)\)/g, '')
    .replace(/\[(.+?)\]/g, ':$1')
    .replace(/\/\//g, '/')
  return /^\//.test(filePath) ? filePath : '/' + filePath
}

/*
  /app/routes/_error.tsx
  /app/routes/_404.tsx
  => {
    '/app/routes': {
      '/app/routes/_error.tsx': file,
      '/app/routes/_404.tsx': file
    }
    ...
  }
 */
export const groupByDirectory = <T = unknown>(files: Record<string, T>) => {
  const organizedFiles = {} as Record<string, Record<string, T>>

  for (const [path, content] of Object.entries(files)) {
    const pathParts = path.split('/')
    const fileName = pathParts.pop()
    const directory = pathParts.join('/')

    if (!organizedFiles[directory]) {
      organizedFiles[directory] = {}
    }

    if (fileName) {
      organizedFiles[directory][fileName] = content
    }
  }

  // Sort the files in each directory
  for (const [directory, files] of Object.entries(organizedFiles)) {
    const sortedEntries = Object.entries(files).sort(([keyA], [keyB]) => {
      if (keyA[0] === '[' && keyB[0] !== '[') {
        return 1
      }
      if (keyA[0] !== '[' && keyB[0] === '[') {
        return -1
      }
      return keyA.localeCompare(keyB)
    })

    organizedFiles[directory] = Object.fromEntries(sortedEntries)
  }

  return organizedFiles
}

export const sortDirectoriesByDepth = <T>(directories: Record<string, T>) => {
  const sortedKeys = Object.keys(directories).sort((a, b) => {
    const depthA = a.split('/').length
    const depthB = b.split('/').length
    return depthA - depthB || b.localeCompare(a)
  })

  return sortedKeys.map((key) => ({
    [key]: directories[key],
  })) as Record<string, T>[]
}

/*
    /app/routes/_renderer.tsx
    /app/routes/blog/_renderer.tsx
    => {
      '/app/routes': ['/app/routes/_renderer.tsx']
      '/app/routes/blog': ['/app/routes/blog/_renderer.tsx', '/app/routes/_.tsx']
    }
   */
export const listByDirectory = <T = unknown>(files: Record<string, T>) => {
  const organizedFiles = {} as Record<string, string[]>

  for (const path of Object.keys(files)) {
    const pathParts = path.split('/')
    pathParts.pop() // extract file
    const directory = pathParts.join('/')

    if (!organizedFiles[directory]) {
      organizedFiles[directory] = []
    }
    if (!organizedFiles[directory].includes(path)) {
      organizedFiles[directory].push(path)
    }
  }

  const directories = Object.keys(organizedFiles).sort((a, b) => b.length - a.length)
  for (const dir of directories) {
    for (const subDir of directories) {
      if (subDir.startsWith(dir) && subDir !== dir) {
        const uniqueFiles = new Set([...organizedFiles[subDir], ...organizedFiles[dir]])
        organizedFiles[subDir] = [...uniqueFiles]
      }
    }
  }

  return organizedFiles
}

export const pathToDirectoryPath = (path: string) => {
  const dirPath = path.replace(/[^\/]+$/, '')
  return dirPath
}
