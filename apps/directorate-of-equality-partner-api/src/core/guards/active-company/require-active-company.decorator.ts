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
 * it: that keeps the rule greppable, and keeps a future route able to opt out
 * deliberately (by declaring nothing) instead of by forgetting.
 */
export const RequireActiveCompany = () =>
  SetMetadata(ACTIVE_COMPANY_METADATA, true)
