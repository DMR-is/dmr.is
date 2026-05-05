import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type ParserBuilder,
  useQueryStates,
} from 'nuqs'
import { z } from 'zod'

import { zListReportsQuery } from '../gen/fetch/zod.gen'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function zodToNuqsParser(schema: z.ZodType): ParserBuilder<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)._zod.def

  switch (def.type) {
    case 'default':
      return zodToNuqsParser(def.innerType).withDefault(schema.parse(undefined))
    case 'optional':
      return zodToNuqsParser(def.innerType)
    case 'array':
      return parseAsArrayOf(zodToNuqsParser(def.element))
    case 'enum':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parseAsStringLiteral((schema as any).options)
    case 'boolean':
      return parseAsBoolean
    case 'int':
      return parseAsInteger
    case 'number':
      return parseAsFloat
    default:
      // string, pipe (uuid, datetime), and any other types map to string
      return parseAsString
  }
}

type ZodShapeParsers<T extends z.ZodObject<z.ZodRawShape>> = {
  [K in keyof z.output<T>]-?: ParserBuilder<NonNullable<z.output<T>[K]>>
}

function zodObjectToNuqsParsers<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
): ZodShapeParsers<T> {
  return Object.fromEntries(
    Object.entries(schema.shape).map(([key, fieldSchema]) => [
      key,
      zodToNuqsParser(fieldSchema as z.ZodType),
    ]),
  ) as ZodShapeParsers<T>
}

const parsers = zodObjectToNuqsParsers(zListReportsQuery)

export const useReportsFilter = () => {
  const [filter, setFilter] = useQueryStates(parsers)

  const query = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== null),
  ) as z.infer<typeof zListReportsQuery>

  return { filter, setFilter, query }
}
