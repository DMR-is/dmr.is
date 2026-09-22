import { getMetadataStorage } from 'class-validator'

import { CreateReportDto } from './create-report.dto'

/**
 * The half of the claim that had nothing holding it up.
 *
 * `CreateSalaryOptions` says the channel options are "passed beside the body,
 * never in it". That was pinned for the partner contract and asserted nowhere
 * for this one — and `CreateReportDto` is the `@Body()` of
 * `POST /api/v1/reports/salary`, so while they were declared here any
 * authenticated applicant could send `withdrawPostponedSibling: true` and retire
 * their own deliberate postponement, or `postponeUnexplainedOutliers: true` and
 * file `POSTPONED` where the service means to answer `400`.
 *
 * Same company only, so never a cross-tenant hole — but the design's central
 * claim was false on the one surface nothing checked, and the partner spec
 * asserting the opposite is what would have stopped anyone looking.
 *
 * ⚠️ **Asserted on validation metadata, not on a rejected request.** This app
 * runs `whitelist` *without* `forbidNonWhitelisted`, so an unknown field is
 * stripped silently rather than refused — there is no 400 to catch. What made
 * the fields settable was `@ApiOptionalBoolean` registering `IsOptional` +
 * `IsBoolean` for them, which is precisely what survives whitelisting. So that
 * is the thing to check for: if either field is ever decorated here again, its
 * metadata reappears and this fails.
 */
describe('CreateReportDto — channel options are not request fields', () => {
  const declaredProperties = () =>
    getMetadataStorage()
      .getTargetValidationMetadatas(CreateReportDto, '', true, false)
      .map((metadata) => metadata.propertyName)

  it.each(['postponeUnexplainedOutliers', 'withdrawPostponedSibling'])(
    'declares no validation for %s, so whitelisting strips it',
    (field) => {
      expect(declaredProperties()).not.toContain(field)
    },
  )

  /**
   * Guards the assertion itself: if `getTargetValidationMetadatas` ever stopped
   * returning this DTO's properties, the test above would pass vacuously and
   * report nothing for the rest of the file's life.
   */
  it('still sees the fields this body does declare', () => {
    expect(declaredProperties()).toContain('outlierGroups')
  })
})
