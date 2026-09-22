import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { API_SCOPE_METADATA } from '../../core/guards/api-key-scope/require-api-scope.decorator'
import { PartnerController } from './partner.controller'

/**
 * `PUT /partner/reports/:providerId/outliers` is the exit from `POSTPONED`, and
 * it is the first route on this surface that *writes* to a report someone else
 * filed. What stops a `report:read` key using it is one decorator, and nothing
 * else in the suite looks at that decorator.
 *
 * Scope metadata rather than a request: `RequireApiScopeGuard` is already
 * covered by its own spec, so what is missing is not "does the guard work" but
 * "does this route declare the thing the guard reads".
 */
describe('PUT …/outliers — what the route declares', () => {
  const scopeFor = (handler: (...args: never[]) => unknown) =>
    Reflect.getMetadata(API_SCOPE_METADATA, handler)

  it('requires salary:submit, not report:read', () => {
    // Writing explanations completes a filing, so it is a submit act even
    // though it reads like an edit. A key narrowed to reading reports must not
    // be able to move a report into the reviewer queue.
    expect(
      scopeFor(
        PartnerController.prototype.editReportOutliers as unknown as (
          ...args: never[]
        ) => unknown,
      ),
    ).toBe(ApiKeyScopeEnum.SALARY_SUBMIT)
  })

  it('matches the scope the salary submission requires', () => {
    // The two are halves of one filing: if they ever diverge, a vendor can start
    // a submission it is not allowed to finish.
    const submit = PartnerController.prototype
      .submitSalaryReport as unknown as (...args: never[]) => unknown
    const edit = PartnerController.prototype.editReportOutliers as unknown as (
      ...args: never[]
    ) => unknown

    expect(scopeFor(edit)).toBe(scopeFor(submit))
  })

  it('reads the outliers under report:read, which is a different act', () => {
    const read = PartnerController.prototype.getReportOutliers as unknown as (
      ...args: never[]
    ) => unknown

    expect(scopeFor(read)).toBe(ApiKeyScopeEnum.REPORT_READ)
  })
})
