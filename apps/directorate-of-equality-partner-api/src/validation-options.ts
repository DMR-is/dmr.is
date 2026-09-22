import { ValidationPipeOptions } from '@nestjs/common'

/**
 * The validation this surface applies, in one place.
 *
 * Exported rather than inlined in `bootstrap` because the equality submission
 * arrives as `multipart/form-data`: its JSON part is a *string* to the global
 * pipe, so it has to be parsed and validated by a pipe of its own. Two
 * `ValidationPipe` configurations would be two sets of rules that agree today —
 * and "previews clean, rejected at submit" has been found three times in this
 * codebase already. Sharing the options is what makes the multipart path
 * unable to be more permissive than the JSON one.
 */
export const PARTNER_VALIDATION_OPTIONS: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  // Unlike the sibling app, which strips unknown fields silently. On a
  // public API that silence is a trap: a vendor misspells a field, the
  // request succeeds, and the value is quietly absent from the report. Tell
  // them instead.
  forbidNonWhitelisted: true,
}
