// borrowed from here https://github.com/HermannBjorgvin/Kennitala/blob/1.2.6/kennitala.js#L150
function isPerson(kt: string) {
  const d = Number.parseInt(kt.substring(0, 2), 10)
  const m = Number.parseInt(kt.substring(2, 4), 10)

  return d > 0 && d <= 31 && m > 0 && m <= 12
}
const nationalIdRegexp = /\b\d{6}-?\d{4}\b/g
const isProd = process.env['NODE_ENV'] === 'production'
const replaceString = isProd ? '--MASKED--' : '**REMOVE_PII: $&**'

export const maskNationalId = (text: string) => {
  const matches = text.match(nationalIdRegexp) || []
  matches.forEach((match) => {
    if (isPerson(match)) {
      text = text.replace(match, replaceString)
    }
  })
  return text
}

/**
 * Recursively masks PII fields (nationalId, kennitala, ssn, national_id) in objects and arrays.
 * Uses the existing maskNationalId function to mask valid kennitölur.
 */
export const maskPiiInObject = <T>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskPiiInObject(item)) as T
  }

  const result: Record<string | symbol, unknown> = {}
  const piiFieldNames = ['nationalId', 'kennitala', 'ssn', 'national_id']

  // Handle both string and symbol keys
  const allKeys = [
    ...Object.keys(obj),
    ...Object.getOwnPropertySymbols(obj),
  ]

  for (const key of allKeys) {
    const value = (obj as Record<string | symbol, unknown>)[key]

    if (typeof key === 'string' && piiFieldNames.includes(key)) {
      if (typeof value === 'string') {
        // Use existing maskNationalId logic to validate and mask
        const masked = maskNationalId(value)
        result[key] = masked === value ? value : replaceString
      } else {
        result[key] = value
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = maskPiiInObject(value)
    } else {
      result[key] = value
    }
  }

  return result as T
}
