import { ResultWrapper } from '@dmr.is/types'

import { CaseCreateService } from './case-create.service'

const PARTY_ID = 'party-1'

const application = {
  id: 'app-1',
  applicant: '0101010000',
  answers: { advert: { involvedPartyId: PARTY_ID } },
}

describe('CaseCreateService.createCaseByApplication involved party', () => {
  const institutionLookup = jest.fn()
  const getApplication = jest.fn()
  const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() }

  // Only the first three constructor dependencies are reached before the
  // party check; getCreateCaseBody is stubbed to stop right after it.
  const service = new (CaseCreateService as unknown as new (
    ...args: unknown[]
  ) => CaseCreateService)(logger, { institutionLookup }, { getApplication })
  let getCreateCaseBody: jest.SpyInstance

  const submit = (caller: { involvedPartyIds?: string[] }) =>
    service.createCaseByApplication({ applicationId: 'app-1' }, caller)

  beforeEach(() => {
    jest.clearAllMocks()
    getCreateCaseBody = jest
      .spyOn(service as never, 'getCreateCaseBody')
      .mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'stop' }) as never,
      )
    getApplication.mockResolvedValue(ResultWrapper.ok({ application }))
  })

  it("allows one of the caller's own involved parties", async () => {
    await submit({ involvedPartyIds: [PARTY_ID] })

    expect(getCreateCaseBody).toHaveBeenCalled()
    expect(institutionLookup).not.toHaveBeenCalled()
  })

  it("allows the applicant's own involved party", async () => {
    institutionLookup.mockResolvedValue(
      ResultWrapper.ok({ id: PARTY_ID, nationalId: '010101-0000' }),
    )

    await submit({ involvedPartyIds: [] })

    expect(getCreateCaseBody).toHaveBeenCalled()
  })

  it('rejects another involved party with a 403', async () => {
    institutionLookup.mockResolvedValue(
      ResultWrapper.ok({ id: PARTY_ID, nationalId: '0909090000' }),
    )

    const result = await submit({ involvedPartyIds: ['party-2'] })

    expect(result.result.ok).toBe(false)
    expect(result.result.ok === false && result.result.error.code).toBe(403)
    expect(getCreateCaseBody).not.toHaveBeenCalled()
  })

  it('rejects an unknown involved party with a 403', async () => {
    institutionLookup.mockResolvedValue(
      ResultWrapper.err({ code: 404, message: 'x' }),
    )

    const result = await submit({})

    expect(result.result.ok === false && result.result.error.code).toBe(403)
    expect(getCreateCaseBody).not.toHaveBeenCalled()
  })
})
