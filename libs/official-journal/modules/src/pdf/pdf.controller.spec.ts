import { ROLES_KEY } from '@dmr.is/constants'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard } from '../guards/auth'
import { PdfController } from './pdf.controller'

/**
 * Pins the route's guard stack, so a dropped decorator fails the build.
 */
describe('PdfController route guards', () => {
  const handler = PdfController.prototype.getPdfByApplicationId

  it('getPdfByApplicationId verifies the bearer token', () => {
    expect(Reflect.getMetadata('__guards__', handler) ?? []).toContain(
      TokenJwtAuthGuard,
    )
  })

  // Called by island.is for an applicant, who is not in the staff user table:
  // RoleGuard here would 403 the live consumer. Asserted so nobody "tightens"
  // it to a staff check without understanding why.
  it('getPdfByApplicationId authenticates without a staff role check', () => {
    expect(Reflect.getMetadata('__guards__', handler) ?? []).not.toContain(
      RoleGuard,
    )
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined()
  })

  it('no longer exposes the case route or the url companion routes', () => {
    // Deleted rather than guarded: nothing called them.
    expect('getPdfByCaseId' in PdfController.prototype).toBe(false)
    expect('getPdfUrlByCaseId' in PdfController.prototype).toBe(false)
    expect('getPdfUrlByApplicationId' in PdfController.prototype).toBe(false)
  })
})

describe('PdfController caller identity', () => {
  it('passes only the token subject to the service', async () => {
    const getPdfByApplicationId = jest
      .fn()
      .mockResolvedValue({ unwrap: () => Buffer.from('x') })
    const controller = new PdfController({ getPdfByApplicationId } as never)

    await controller.getPdfByApplicationId('id', { showDate: false }, {
      user: { nationalId: '0101010000', actor: { nationalId: '0202020000' } },
    } as never)

    expect(getPdfByApplicationId).toHaveBeenCalledWith(
      'id',
      { nationalId: '0101010000' },
      false,
    )
  })
})
