/**
 * Native replacement for lodash/get.
 * Safely access a deeply nested property using a dot-notation path.
 */

// Unique sentinel type for "path could not be resolved".
// Using a branded symbol avoids collisions with real value types.
declare const NOT_RESOLVED: unique symbol
type NotResolved = typeof NOT_RESOLVED

// `T extends T` forces distributive evaluation over union types.
// Without it, `keyof (A | B | C)` = intersection of keys, so paths through
// disjoint sub-types (e.g. CommonFields vs RecallFields) always fail.
// With it, TypeScript evaluates GetFieldType<A>, GetFieldType<B>,
// GetFieldType<C> separately, then unions the results.
type GetFieldType<T, Path extends string> = T extends T
  ? Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? GetFieldType<NonNullable<T[Key]>, Rest>
      : NotResolved
    : Path extends keyof T
      ? T[Path]
      : NotResolved
  : never

// When the path can't be statically resolved, GetFieldType returns NotResolved.
// For union types (e.g. ApplicationAnswers), TypeScript distributes GetFieldType
// over each member — some may resolve, others return NotResolved.
// Resolve* helpers strip NotResolved from the result:
//   - Fully unresolved → `any` (without default) or `D` (with default)
//   - Partially resolved → the resolved members only

// Without default: fall back to `any` for completely unresolvable paths.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Resolve<T> = [T] extends [NotResolved] ? any : Exclude<T, NotResolved>

// With default: strip null/undefined/NotResolved, union with D.
type ResolveDefault<T, D> = [T] extends [NotResolved]
  ? D
  : Exclude<T, null | undefined | NotResolved> | D

export function get<T, P extends string>(
  obj: T,
  path: P,
): Resolve<GetFieldType<NonNullable<T>, P>>

export function get<T, P extends string, D>(
  obj: T,
  path: P,
  defaultValue: D,
): ResolveDefault<GetFieldType<NonNullable<T>, P>, D>

export function get(
  obj: unknown,
  path: string,
  defaultValue?: unknown,
): unknown {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)

  let result: unknown = obj
  for (const key of keys) {
    if (result == null) {
      return defaultValue
    }
    result = (result as Record<string, unknown>)[key]
  }

  return result === undefined ? defaultValue : result
}

export default get
