import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { EditOutlierGroupDto } from '../../application/dto/edit-outliers.dto'
import { CreateReportOutlierGroupDto } from './create-report.dto'

const VALID = {
  reason: 'Ástæða',
  action: 'Aðgerð',
  signatureName: 'Anna',
  signatureRole: 'Mannauðsstjóri',
  remedyDate: '2027-06-30',
  employeeOrdinals: [1],
}

const TEXT_FIELDS = [
  'reason',
  'action',
  'signatureName',
  'signatureRole',
] as const

// The draft flow already trims these before judging them non-empty
// (report-draft-outlier-group.service.ts); the filing and edit DTOs must refuse
// the same blanks, or a whitespace explanation files through one channel and
// not the other.
describe.each([
  ['CreateReportOutlierGroupDto', CreateReportOutlierGroupDto],
  ['EditOutlierGroupDto', EditOutlierGroupDto],
] as const)('%s', (_name, Dto) => {
  const errorsFor = (plain: object) =>
    validateSync(plainToInstance(Dto, plain), {
      whitelist: true,
      forbidNonWhitelisted: true,
    })

  it('accepts a complete explanation', () => {
    expect(errorsFor(VALID)).toEqual([])
  })

  it.each(TEXT_FIELDS)('refuses a whitespace-only %s', (field) => {
    const errors = errorsFor({ ...VALID, [field]: '   ' })

    expect(errors.map((e) => e.property)).toEqual([field])
  })

  it('stores the text trimmed', () => {
    const dto = plainToInstance(Dto, { ...VALID, reason: '  Ástæða  ' })

    expect(dto.reason).toBe('Ástæða')
  })
})
