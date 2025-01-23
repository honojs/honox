export const ensureTrailngSlash = (path: string) => {
  return path.endsWith('/') ? path : path + '/'
}
