/**
 * Native replacement for lodash/omit.
 * Creates a new object with the specified keys removed.
 *
 * Supports both array and variadic string arguments:
 *   omit(obj, ['a', 'b'])
 *   omit(obj, 'a', 'b')
 *   omit(obj, 'a')
 */

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: ReadonlyArray<K>,
): Omit<T, K>

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K>

export function omit<T extends Record<string, unknown>>(
  obj: T,
  keys: ReadonlyArray<string>,
): Partial<T>

export function omit<T extends Record<string, unknown>>(
  obj: T,
  ...keys: string[]
): Partial<T>

export function omit(
  obj: Record<string, unknown>,
  ...args: Array<string | ReadonlyArray<string>>
): Record<string, unknown> {
  const keysToOmit = new Set(
    args.length === 1 && Array.isArray(args[0])
      ? (args[0] as string[])
      : (args as string[]),
  )
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    if (!keysToOmit.has(key)) {
      result[key] = obj[key]
    }
  }

  return result
}

export default omit
