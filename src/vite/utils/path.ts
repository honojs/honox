/**
 * Check if the name is a valid component name
 *
 * @param name - The name to check
 * @returns true if the name is a valid component name
 * @example
 * isComponentName('Badge') // true
 * isComponentName('BadgeComponent') // true
 * isComponentName('badge') // false
 * isComponentName('MIN') // false
 * isComponentName('Badge_Component') // false
 */
export function isComponentName(name: string) {
  return /^[A-Z][A-Z0-9]*[a-z][A-Za-z0-9]*$/.test(name)
}

/**
 * Matches when id is the filename of Island component
 *
 * @param id - The id to match
 * @returns The result object if id is matched or null
 */
export function matchIslandComponentId(id: string, islandDir: string = '/islands') {
  const regExp = new RegExp(
    `^${islandDir}\/.+?\.tsx$|.*\/(?:\_[a-zA-Z0-9-]+\.island\.tsx$|\\\$[a-zA-Z0-9-]+\.tsx$)`
  )
  return id.match(regExp)
}
