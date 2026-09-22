import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { SubmitPartnerSalaryReportDto } from '@dmr.is/doe-modules/application'

import { PARTNER_VALIDATION_OPTIONS } from '../../validation-options'

/**
 * `outliersPostponed` is gone from this channel's contract, and this is what
 * makes that a refusal rather than a silent drop.
 *
 * The partner API runs `forbidNonWhitelisted`, so a field the DTO does not
 * declare is a `400` naming it — which matters more here than for a typo. A
 * vendor sending the old flag is a vendor that believes it is choosing whether
 * to postpone, and on this channel that choice is not available: omitting the
 * groups when outliers exist *is* the postpone. Ignoring the field would leave
 * that vendor with a wrong model of the contract and no signal.
 */
describe('SubmitPartnerSalaryReportDto — the outlier contract', () => {
  const errorsFor = (payload: Record<string, unknown>) =>
    validateSync(
      plainToInstance(SubmitPartnerSalaryReportDto, payload),
      // The app's own options, not a copy of them. Restating the two flags here
      // meant this spec would keep passing if `forbidNonWhitelisted` were
      // dropped from `bootstrap` — it would have been asserting its own
      // literals. Which is also why the spec lives here rather than beside the
      // DTO: a lib cannot reach into the app that configures the validation.
      PARTNER_VALIDATION_OPTIONS,
    )

  const propertiesRejected = (payload: Record<string, unknown>) =>
    errorsFor(payload).map((error) => error.property)

  it('refuses outliersPostponed, which this channel no longer decides', () => {
    expect(propertiesRejected({ outliersPostponed: true })).toContain(
      'outliersPostponed',
    )
  })

  it('refuses it when false as well — the field is gone, not defaulted', () => {
    expect(propertiesRejected({ outliersPostponed: false })).toContain(
      'outliersPostponed',
    )
  })

  /**
   * The counterpart: outlier groups are still the caller's to send, and sending
   * them is how a submission avoids landing POSTPONED in the first place.
   */
  it('still accepts outlierGroups', () => {
    expect(propertiesRejected({ outlierGroups: [] })).not.toContain(
      'outlierGroups',
    )
  })

  /**
   * Neither option is a field on this contract, and a review found they were
   * fields on the *shared* `CreateReportDto` — which is the body of the
   * island.is creation route, so an applicant there could set either one. They
   * are a separate argument now (`CreateSalaryOptions`), off every wire
   * contract. This pins the partner half; `create-report-options.spec.ts` pins
   * the other.
   */
  it.each(['postponeUnexplainedOutliers', 'withdrawPostponedSibling'])(
    'refuses %s — channel policy is not a request field',
    (field) => {
      expect(propertiesRejected({ [field]: true })).toContain(field)
    },
  )
})
