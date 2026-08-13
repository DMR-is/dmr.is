/**
 * Sorts every `parameters` array in an OpenAPI document into a deterministic
 * order, in place, and returns the same document.
 *
 * WHY THIS EXISTS -- do not "simplify" it away:
 *
 * The OpenAPI snapshot specs (`apps/<api>/src/app/app.spec.ts`) exist to gate
 * the `@nestjs/swagger` upgrade: five web apps consume generated clients, so the
 * before/after diff of the emitted document is how that risk is measured. A gate
 * is only worth having if every line of its diff means something.
 *
 * Without this sort, the emitted `parameters` order depends on how ts-jest
 * happened to compile the controller, not on the API surface. For a path
 * parameter typed as a string enum, TypeScript emits either `String` (full
 * program) or a runtime `typeof x === 'function' ? x : Object` guard that
 * resolves to `Object` (transpile-only). `@nestjs/swagger` drops a reflected
 * parameter whose type is `Object`, so the path parameter then survives only
 * through its explicit `@ApiParam`, which `unionWith` appends *after* the
 * reflected query parameters instead of before them. Adding any `setupFiles`
 * entry to a jest config -- or simply running with a cold jest cache -- flips
 * which emit ts-jest produces, moving the path parameter from first to last.
 *
 * That ordering is not semantic. In OpenAPI, `parameters` is a set keyed by
 * `name` + `in`, and the generators these snapshots protect key on the same
 * pair. Sorting it costs the gate nothing and removes the only churn that was
 * measured to be spurious.
 *
 * Only `parameters` is normalised. Everything else in the document is left
 * exactly as emitted so the snapshot can still detect a change in it -- notably
 * `tags` (the first tag decides which generated API class an operation lands
 * in), `servers` (the first entry is the default base URL), `allOf` (composition
 * order) and `enum` (member order shows up in generated clients). Object key
 * order needs no handling at all: jest's snapshot serializer already prints
 * object keys sorted.
 */

/**
 * Structurally typed so the same helper accepts `OpenAPIObject` from
 * `@nestjs/swagger` without this package depending on NestJS, and so the
 * traversal below needs no casts.
 */
type DocumentLike = {
  readonly paths?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringField = (value: unknown, field: string): string => {
  if (!isRecord(value)) {
    return ''
  }

  const raw = value[field]

  return typeof raw === 'string' ? raw : ''
}

/**
 * `localeCompare` is deliberately avoided: its ordering varies with the ICU data
 * the runtime was built against, which would trade one source of snapshot
 * nondeterminism for another. Plain `<` / `>` is code-unit order, identical
 * everywhere.
 */
const compareStrings = (a: string, b: string): number => {
  if (a < b) return -1
  if (a > b) return 1

  return 0
}

/**
 * Orders by `in`, then `name` -- the pair that identifies a parameter in
 * OpenAPI. `$ref` is the last tiebreaker because reference parameters carry
 * neither of the other two.
 */
const compareParameters = (a: unknown, b: unknown): number =>
  compareStrings(stringField(a, 'in'), stringField(b, 'in')) ||
  compareStrings(stringField(a, 'name'), stringField(b, 'name')) ||
  compareStrings(stringField(a, '$ref'), stringField(b, '$ref'))

const sortParametersOf = (holder: Record<string, unknown>): void => {
  const parameters = holder['parameters']

  if (Array.isArray(parameters)) {
    parameters.sort(compareParameters)
  }
}

export function sortOpenApiParameters<T extends DocumentLike>(document: T): T {
  const paths = document.paths

  if (!isRecord(paths)) {
    return document
  }

  for (const pathItem of Object.values(paths)) {
    if (!isRecord(pathItem)) {
      continue
    }

    // Path-item level parameters, shared by every operation on the path.
    sortParametersOf(pathItem)

    for (const [key, operation] of Object.entries(pathItem)) {
      if (key !== 'parameters' && isRecord(operation)) {
        sortParametersOf(operation)
      }
    }
  }

  return document
}

export default sortOpenApiParameters
