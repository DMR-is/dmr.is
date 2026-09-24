import { InternalServerErrorException } from '@nestjs/common'

import { MailboxDeliveryKindEnum } from './models/mailbox-delivery.enums'
import { buildMailboxDeliveryIdempotencyKey } from './mailbox-delivery.idempotency-key'

const COMPANY_ID = '5f0c2f7e-9d2b-4c55-8f0a-2b7c8b1e4a10'

describe('buildMailboxDeliveryIdempotencyKey', () => {
  it('builds the documented format', () => {
    expect(
      buildMailboxDeliveryIdempotencyKey({
        kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        companyId: COMPANY_ID,
        discriminator: 'SALARY-20270301',
      }),
    ).toBe(`mailbox-delivery:v1:OVERDUE_NOTICE:${COMPANY_ID}:SALARY-20270301`)
  })

  it('is stable: the same parts always give the same key', () => {
    const parts = {
      kind: MailboxDeliveryKindEnum.FINES_PRECURSOR,
      companyId: COMPANY_ID,
      discriminator: 'EQUALITY-20261231',
    }
    expect(buildMailboxDeliveryIdempotencyKey({ ...parts })).toBe(
      buildMailboxDeliveryIdempotencyKey({ ...parts }),
    )
  })

  it.each([
    ['kind', { kind: MailboxDeliveryKindEnum.FINES_PRECURSOR }],
    ['companyId', { companyId: '6a1d3f8f-0e3c-4d66-9f1b-3c8d9c2f5b21' }],
    ['discriminator', { discriminator: 'SALARY-20280301' }],
  ])('changes when %s changes', (_part, change) => {
    const base = {
      kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
      companyId: COMPANY_ID,
      discriminator: 'SALARY-20270301',
    }
    expect(buildMailboxDeliveryIdempotencyKey({ ...base, ...change })).not.toBe(
      buildMailboxDeliveryIdempotencyKey(base),
    )
  })

  it.each([
    ['empty', ''],
    ['a colon, which would let two part sets collide', 'SALARY:20270301'],
    ['whitespace', 'SALARY 20270301'],
    ['over 64 characters', 'A'.repeat(65)],
    ['a non-ASCII letter', 'ÁRSSKÝRSLA-2027'],
    ['a slash', 'SALARY/20270301'],
  ])('rejects a discriminator with %s', (_why, discriminator) => {
    expect(() =>
      buildMailboxDeliveryIdempotencyKey({
        kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        companyId: COMPANY_ID,
        discriminator,
      }),
    ).toThrow(InternalServerErrorException)
  })

  it.each([
    ['64 characters', 'A'.repeat(64)],
    ['a leading separator', '-SALARY'],
    ['dots and underscores', 'SALARY_2027.03.01'],
  ])('accepts a discriminator with %s', (_why, discriminator) => {
    expect(
      buildMailboxDeliveryIdempotencyKey({
        kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        companyId: COMPANY_ID,
        discriminator,
      }),
    ).toBe(`mailbox-delivery:v1:OVERDUE_NOTICE:${COMPANY_ID}:${discriminator}`)
  })

  it('upper-cases the discriminator, so its case never makes a second key', () => {
    const key = (discriminator: string) =>
      buildMailboxDeliveryIdempotencyKey({
        kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        companyId: COMPANY_ID,
        discriminator,
      })

    expect(key('salary-20270301')).toBe(key('SALARY-20270301'))
    expect(key('Salary-20270301')).toBe(key('SALARY-20270301'))
    expect(key('salary-20270301')).toBe(
      `mailbox-delivery:v1:OVERDUE_NOTICE:${COMPANY_ID}:SALARY-20270301`,
    )
  })

  it('gives the same key for the company id in upper and lower case', () => {
    const parts = {
      kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
      discriminator: 'SALARY-20270301',
    }
    const lower = buildMailboxDeliveryIdempotencyKey({
      ...parts,
      companyId: COMPANY_ID,
    })

    expect(
      buildMailboxDeliveryIdempotencyKey({
        ...parts,
        companyId: COMPANY_ID.toUpperCase(),
      }),
    ).toBe(lower)
    expect(
      buildMailboxDeliveryIdempotencyKey({
        ...parts,
        companyId: '5F0C2F7E-9d2b-4C55-8f0a-2B7C8B1E4A10',
      }),
    ).toBe(lower)
    expect(lower).toContain(`:${COMPANY_ID}:`)
  })

  it.each([
    ['empty', ''],
    ['a colon', 'a:b'],
    ['not a UUID', 'company-1'],
    ['a kennitala', '0101302989'],
    ['a UUID with no hyphens', '5f0c2f7e9d2b4c558f0a2b7c8b1e4a10'],
    ['a UUID with extra characters', `${COMPANY_ID}x`],
    ['a braced UUID', `{${COMPANY_ID}}`],
  ])('rejects a company id that is %s', (_why, companyId) => {
    expect(() =>
      buildMailboxDeliveryIdempotencyKey({
        kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        companyId,
        discriminator: 'SALARY-20270301',
      }),
    ).toThrow(InternalServerErrorException)
  })

  it('rejects an unknown kind', () => {
    expect(() =>
      buildMailboxDeliveryIdempotencyKey({
        kind: 'SOMETHING_ELSE' as MailboxDeliveryKindEnum,
        companyId: COMPANY_ID,
        discriminator: 'SALARY-20270301',
      }),
    ).toThrow(InternalServerErrorException)
  })
})
