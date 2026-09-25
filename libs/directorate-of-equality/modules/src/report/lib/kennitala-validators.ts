import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValid as isValidKennitala } from 'kennitala'

const TEN_DIGITS = /^\d{10}$/

/**
 * `XXXXXX-XXXX` → `XXXXXXXXXX`; anything else is returned as it came, for the
 * validator to judge. Pair with `@Transform(({ value }) => stripKennitalaDash(value))`
 * so a dashed kennitala is stored in the one form lookups compare against.
 */
export const stripKennitalaDash = (value: unknown): unknown =>
  typeof value === 'string'
    ? value.trim().replace(/^(\d{6})-(\d{4})$/, '$1$2')
    : value

/**
 * A kennitala as it is stored: ten digits, no dash, with a valid checksum.
 * Strip the dash first with `stripKennitalaDash`.
 *
 * Checked at the DTO rather than left to the national registry, which answers
 * a malformed one with the same 404 as one it does not hold — so without this,
 * `"123"` cost a registry round trip to be told nothing more specific.
 */
export function IsKennitala(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isKennitala',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a kennitala of 10 digits with no dash`,
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' &&
          TEN_DIGITS.test(value) &&
          isValidKennitala(value),
      },
    })
}

/**
 * Refuses a value that is a valid kennitala, with or without its dash.
 *
 * For fields that must stay pseudonymous — an employee's `identifier` is shown
 * to reviewers and is the employer's own handle, never a national id. A plain
 * 10-digit handle that happens to pass the checksum is refused too; that rare
 * false match is the price of not publishing a real one.
 */
export function IsNotKennitala(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isNotKennitala',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must not be a kennitala — use a pseudonymous handle of your own`,
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown) => {
          if (typeof value !== 'string') {
            return true
          }
          const digits = stripKennitalaDash(value) as string
          return !(TEN_DIGITS.test(digits) && isValidKennitala(digits))
        },
      },
    })
}
