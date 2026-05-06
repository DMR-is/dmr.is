import {
  $,
  type DefinePlugin,
  definePluginConfig,
  type IR,
} from '@hey-api/openapi-ts'

export type UserConfig = {
  name: 'nuqs-parsers'
  output?: string
}

export type NuqsPlugin = DefinePlugin<UserConfig>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDsl = any

function schemaToParser(
  schema: IR.SchemaObject,
  nuqs: Record<string, AnyDsl>,
  enumMap: Map<string, string[]>,
): AnyDsl {
  const {
    parseAsArrayOf,
    parseAsBoolean,
    parseAsFloat,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
  } = nuqs

  // $ref schemas — resolve to enum literal parser or string fallback
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop() ?? ''
    const values = enumMap.get(refName)
    return values
      ? $(parseAsStringLiteral).call($.fromValue(values))
      : $(parseAsString)
  }

  let base: AnyDsl

  switch (schema.type) {
    case 'integer':
      base = $(parseAsInteger)
      break
    case 'number':
      base = $(parseAsFloat)
      break
    case 'boolean':
      base = $(parseAsBoolean)
      break
    case 'enum': {
      const values = (schema.items ?? [])
        .map((item) => item.const as string)
        .filter((v) => v !== undefined)
      base = $(parseAsStringLiteral).call($.fromValue(values))
      break
    }
    case 'array': {
      const element = schema.items?.[0]
      base = $(parseAsArrayOf).call(
        element ? schemaToParser(element, nuqs, enumMap) : $(parseAsString),
      )
      break
    }
    default:
      base = $(parseAsString)
  }

  return base
}

const handler: NuqsPlugin['Handler'] = ({ plugin }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nuqs: Record<string, any> = {
    parseAsArrayOf: plugin.symbol('parseAsArrayOf', { external: 'nuqs' }),
    parseAsBoolean: plugin.symbol('parseAsBoolean', { external: 'nuqs' }),
    parseAsFloat: plugin.symbol('parseAsFloat', { external: 'nuqs' }),
    parseAsInteger: plugin.symbol('parseAsInteger', { external: 'nuqs' }),
    parseAsString: plugin.symbol('parseAsString', { external: 'nuqs' }),
    parseAsStringLiteral: plugin.symbol('parseAsStringLiteral', {
      external: 'nuqs',
    }),
  }

  // First pass: collect enum values from component schemas
  const enumMap = new Map<string, string[]>()
  plugin.forEach('schema', (event) => {
    if (event.schema.type === 'enum') {
      const values = (event.schema.items ?? [])
        .map((item) => item.const as string)
        .filter((v) => typeof v === 'string')
      if (values.length > 0) enumMap.set(event.name, values)
    }
  })

  // Second pass: generate parser objects per operation with query params
  plugin.forEach('operation', (event) => {
    const { operation } = event
    const queryParams = operation.parameters?.query
    if (!queryParams || Object.keys(queryParams).length === 0) return

    const obj = $.object()
    for (const [, param] of Object.entries(queryParams)) {
      obj.prop(param.name, schemaToParser(param.schema, nuqs, enumMap))
    }

    const opId = operation.operationId ?? operation.id
    const constName = opId.charAt(0).toLowerCase() + opId.slice(1) + 'Parsers'
    plugin.node($.const(plugin.symbol(constName)).export().assign(obj))
  })
}

export const defaultConfig: NuqsPlugin['Config'] = {
  config: {},
  handler,
  name: 'nuqs-parsers',
}

export default definePluginConfig(defaultConfig)
