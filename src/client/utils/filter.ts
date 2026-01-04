// Avoid character classes in glob patterns for rolldown-vite compatibility
// ref: https://github.com/rolldown/rolldown/issues/4973
export const filterByPattern = <T>(
  files: Record<string, T>,
  patterns: RegExp[]
): Record<string, T> => {
  return Object.fromEntries(
    Object.entries(files).filter(([path]) => patterns.some((pattern) => pattern.test(path)))
  )
}
