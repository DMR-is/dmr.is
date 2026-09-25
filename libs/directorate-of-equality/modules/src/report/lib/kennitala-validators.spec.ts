import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { generateCompany, generatePerson } from 'kennitala'

import { SubmitReportSubsidiaryDto } from '../../application/dto/submit-report-company.dto'
import { IsNotKennitala } from './kennitala-validators'

// Generated rather than written out: `disallow-kennitalas` forbids a
// checksum-valid kennitala in source.
const COMPANY = generateCompany(new Date(2001, 0, 15)) as string
const PERSON = generatePerson(new Date(1985, 5, 3)) as string
const dashed = (kt: string) => `${kt.slice(0, 6)}-${kt.slice(6)}`

class Pseudonymous {
  @IsNotKennitala()
  identifier!: string
}

const errorsFor = <T extends object>(cls: new () => T, plain: object) =>
  validateSync(plainToInstance(cls, plain), {
    whitelist: true,
    forbidNonWhitelisted: true,
  })

describe('kennitala validators', () => {
  describe('SubmitReportSubsidiaryDto.nationalId', () => {
    it('accepts a checksum-valid kennitala', () => {
      expect(
        errorsFor(SubmitReportSubsidiaryDto, {
          name: 'S',
          nationalId: COMPANY,
        }),
      ).toEqual([])
    })

    it('accepts the dashed form and stores it without the dash', () => {
      const dto = plainToInstance(SubmitReportSubsidiaryDto, {
        name: 'S',
        nationalId: dashed(COMPANY),
      })

      expect(validateSync(dto)).toEqual([])
      expect(dto.nationalId).toBe(COMPANY)
    })

    it.each(['123', '12345678901', 'abcdefghij', ''])(
      'refuses %p before any registry lookup',
      (nationalId) => {
        const errors = errorsFor(SubmitReportSubsidiaryDto, {
          name: 'S',
          nationalId,
        })

        expect(errors.map((e) => e.property)).toEqual(['nationalId'])
      },
    )

    it('refuses ten digits whose checksum fails', () => {
      const check = (Number(COMPANY[8]) + 1) % 10
      const broken = `${COMPANY.slice(0, 8)}${check}${COMPANY[9]}`

      expect(
        errorsFor(SubmitReportSubsidiaryDto, { name: 'S', nationalId: broken }),
      ).toHaveLength(1)
    })
  })

  describe('IsNotKennitala', () => {
    it.each([
      ['a person', PERSON],
      ['a person, dashed', dashed(PERSON)],
      ['a company', COMPANY],
      ['padded', ` ${PERSON} `],
    ])('refuses %s', (_label, identifier) => {
      expect(errorsFor(Pseudonymous, { identifier })).toHaveLength(1)
    })

    it.each(['E001', 'starfsmaður-17', '42', `A-${PERSON}`])(
      'accepts the pseudonymous handle %p',
      (identifier) => {
        expect(errorsFor(Pseudonymous, { identifier })).toEqual([])
      },
    )
  })
})
