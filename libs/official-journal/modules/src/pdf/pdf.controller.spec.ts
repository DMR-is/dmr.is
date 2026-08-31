import { ROLES_KEY, UserRoleEnum } from '@dmr.is/constants'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard } from '../guards/auth'
import { PdfController } from './pdf.controller'

/**
 * These routes were reachable unauthenticated on an internet-facing ALB. The
 * assertions below pin the guard stack per route so a dropped decorator fails
 * the build rather than silently reopening the hole.
 */
describe('PdfController route guards', () => {
  const guardsOn = (handler: (...args: never[]) => unknown) =>
    (Reflect.getMetadata('__guards__', handler) ?? []) as Array<unknown>

  const rolesOn = (handler: (...args: never[]) => unknown) =>
    Reflect.getMetadata(ROLES_KEY, handler) as Array<UserRoleEnum> | undefined

  const routes = {
    getPdfByCaseId: PdfController.prototype.getPdfByCaseId,
    getPdfUrlByCaseId: PdfController.prototype.getPdfUrlByCaseId,
    getPdfByApplicationId: PdfController.prototype.getPdfByApplicationId,
    getPdfUrlByApplicationId: PdfController.prototype.getPdfUrlByApplicationId,
  }

  it.each(Object.entries(routes))(
    '%s verifies the bearer token',
    (_name, handler) => {
      expect(guardsOn(handler)).toContain(TokenJwtAuthGuard)
    },
  )

  // Staff-only, and no caller — same stack as CaseController.
  it.each([
    ['getPdfByCaseId', routes.getPdfByCaseId],
    ['getPdfUrlByCaseId', routes.getPdfUrlByCaseId],
  ])('%s is restricted to Admin', (_name, handler) => {
    expect(guardsOn(handler)).toContain(RoleGuard)
    expect(rolesOn(handler)).toEqual([UserRoleEnum.Admin])
  })

  // Called by island.is for an applicant, who is not in the staff user table:
  // RoleGuard here would 403 the live consumer. Asserted so nobody "tightens"
  // these to match the case routes without understanding why they differ.
  it.each([
    ['getPdfByApplicationId', routes.getPdfByApplicationId],
    ['getPdfUrlByApplicationId', routes.getPdfUrlByApplicationId],
  ])('%s authenticates without a staff role check', (_name, handler) => {
    expect(guardsOn(handler)).not.toContain(RoleGuard)
    expect(rolesOn(handler)).toBeUndefined()
  })
})
