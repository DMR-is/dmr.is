/* eslint-disable @typescript-eslint/no-explicit-any -- walks untyped OpenAPI JSON */

/**
 * Compares a served OpenAPI document with a committed copy of it (a web app's
 * `clientConfig.json`) and lists what drifted, one line per operation or
 * schema. Used by each API's `client-config-drift.spec.ts`.
 *
 * The comparison is on the wire format: `JSON.stringify` drops in-memory
 * `undefined` keys, which is what made the snapshots #1405 removed over-report.
 * Parameter order and object key order are ignored; they are not semantic and
 * can vary with how the code was compiled. Every other array keeps its order,
 * so a reordered `enum` or `required` is reported - the check errs strict.
 */
export const describeOpenApiDrift = (
  served: unknown,
  committed: unknown,
): string[] => {
  const live = toWire(served)
  const baseline = toWire(committed)
  const drift: string[] = []

  const [liveOps, baselineOps] = [operations(live), operations(baseline)]
  for (const [key, op] of liveOps) {
    if (!baselineOps.has(key)) drift.push(`+ operation ${key}`)
    else if (!same(op, baselineOps.get(key))) drift.push(`~ operation ${key}`)
  }
  for (const key of baselineOps.keys())
    if (!liveOps.has(key)) drift.push(`- operation ${key}`)

  const liveSchemas = live.components?.schemas ?? {}
  const baselineSchemas = baseline.components?.schemas ?? {}
  for (const name of new Set([
    ...Object.keys(liveSchemas),
    ...Object.keys(baselineSchemas),
  ])) {
    if (!(name in baselineSchemas)) drift.push(`+ schema ${name}`)
    else if (!(name in liveSchemas)) drift.push(`- schema ${name}`)
    else if (!same(liveSchemas[name], baselineSchemas[name]))
      drift.push(`~ schema ${name}`)
  }

  // The rest of components - notably securitySchemes, which decides how a
  // generated client attaches credentials - and the document metadata.
  const { schemas: _a, ...liveComponents } = live.components ?? {}
  const { schemas: _b, ...baselineComponents } = baseline.components ?? {}
  if (!same(liveComponents, baselineComponents))
    drift.push('~ components (other than schemas)')
  const { paths: _c, components: _d, ...liveRest } = live
  const { paths: _e, components: _f, ...baselineRest } = baseline
  if (!same(liveRest, baselineRest)) drift.push('~ document metadata')

  return drift
}

const toWire = (doc: unknown): Record<string, any> => {
  const wire = JSON.parse(JSON.stringify(doc ?? {}))
  for (const ops of Object.values<Record<string, any>>(wire.paths ?? {})) {
    for (const op of Object.values<any>(ops)) {
      op?.parameters?.sort((a: any, b: any) =>
        `${a.in}:${a.name}`.localeCompare(`${b.in}:${b.name}`),
      )
    }
  }
  return wire
}

const operations = (doc: Record<string, any>) =>
  new Map<string, unknown>(
    Object.entries<Record<string, any>>(doc.paths ?? {}).flatMap(
      ([path, methods]) =>
        Object.entries<any>(methods).map(([method, op]) => [
          `${method.toUpperCase()} ${path} (${op?.operationId})`,
          op,
        ]),
    ),
  )

/** Deep equality that ignores object key order. */
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
        )
      : value

const same = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
