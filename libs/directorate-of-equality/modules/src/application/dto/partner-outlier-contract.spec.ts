import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { SubmitPartnerSalaryReportDto } from './submit-partner-salary-report.dto'

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
    validateSync(plainToInstance(SubmitPartnerSalaryReportDto, payload), {
      whitelist: true,
      forbidNonWhitelisted: true,
    })

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
   * Neither option is a field. If either ever became one, a vendor could ask for
   * a POSTPONED sibling to be withdrawn on a channel where that is not the
   * policy — the flag exists so the app states its own shape, not so a request
   * can.
   */
  it.each(['postponeUnexplainedOutliers', 'withdrawPostponedSibling'])(
    'refuses %s — channel policy is not a request field',
    (field) => {
      expect(propertiesRejected({ [field]: true })).toContain(field)
    },
  )
})
