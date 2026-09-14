import { SetMetadata } from '@nestjs/common'

export const ACTIVE_COMPANY_METADATA = 'doeRequireActiveCompany'

/**
 * Declares that a route may only be called for a company that is ACTIVE in
 * Jafnréttisstofa's register.
 *
 * Declared once on `PartnerController`, so it covers the whole API rather than
 * only the submissions: a company that has fallen off the register gets one
 * answer everywhere instead of a surface that half-works. The reads were
 * considered and rejected as an exception — following a report you can no
 * longer file is a thin consolation, and two behaviours would be two things to
 * explain.
 *
 * Still metadata rather than a bare guard, because the guard is inert without
 * it: that keeps the rule greppable, and a surface that has not declared it
 * fails open rather than silently refusing every caller.
 *
 * It is **not** an opt-out mechanism, despite reading like one. The guard
 * resolves with `getAllAndOverride([handler, class])`, so a handler that
 * declares nothing inherits the class-level `true` — there is no way to
 * decline from a route, and nothing exposes one. Excusing a future route would
 * mean a `@SkipActiveCompany()` that sets the metadata `false` at handler
 * level, which does not exist and should not be added until a route needs it.
 */
export const RequireActiveCompany = () =>
  SetMetadata(ACTIVE_COMPANY_METADATA, true)
