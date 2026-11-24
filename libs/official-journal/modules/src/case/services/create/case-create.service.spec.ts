import { ResultWrapper } from '@dmr.is/types'

import { ApplicationCaller } from '../../../auth/application-party'
import { CaseCreateService } from './case-create.service'

const PARTY_ID = '6f1c1a3e-2b4d-4c5e-9f60-7a8b9c0d1e2f'
const OTHER_PARTY_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d'
const FORBIDDEN_MESSAGE =
  'Þú hefur ekki heimild til að senda inn fyrir þessa stofnun'

const applicationWith = (involvedPartyId?: string) => ({
  id: 'app-1',
  applicant: '0101010000',
  assignees: [],
  answers: { advert: { involvedPartyId } },
})

const applicant = { nationalId: '0101010000' }

describe('CaseCreateService.createCaseByApplication involved party', () => {
  const getApplication = jest.fn()
  const getInvolvedPartiesByNationalId = jest.fn()
  const institutionLookup = jest.fn()
  const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() }

  // Only the first four constructor dependencies are reached before the
  // party check; getCreateCaseBody is stubbed to stop right after it.
  const service = new (CaseCreateService as unknown as new (
    ...args: unknown[]
  ) => CaseCreateService)(
    logger,
    { institutionLookup },
    { getApplication },
    { getInvolvedPartiesByNationalId },
  )
  let getCreateCaseBody: jest.SpyInstance

  const offeredParties = (...ids: string[]) =>
    getInvolvedPartiesByNationalId.mockResolvedValue(
      ResultWrapper.ok({ involvedParties: ids.map((id) => ({ id })) }),
    )

  const submit = (caller: ApplicationCaller, involvedPartyId?: string) => {
    getApplication.mockResolvedValue(
      ResultWrapper.ok({ application: applicationWith(involvedPartyId) }),
    )
    return service.createCaseByApplication({ applicationId: 'app-1' }, caller)
  }

  const expectRefusal = (
    result: Awaited<ReturnType<typeof submit>>,
    code: number,
    message?: string,
  ) => {
    expect(result.result.ok).toBe(false)
    if (result.result.ok) return
    expect(result.result.error.code).toBe(code)
    if (message) expect(result.result.error.message).toBe(message)
    expect(getCreateCaseBody).not.toHaveBeenCalled()
  }

  beforeEach(() => {
    jest.resetAllMocks()
    getCreateCaseBody = jest
      .spyOn(service as never, 'getCreateCaseBody')
      .mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'stop' }) as never,
      )
  })

  it("allows one of the caller's own involved parties", async () => {
    await submit({ ...applicant, involvedPartyIds: [PARTY_ID] }, PARTY_ID)

    expect(getCreateCaseBody).toHaveBeenCalled()
    expect(getInvolvedPartiesByNationalId).not.toHaveBeenCalled()
  })

  it('allows an involved party the picker offers for the applicant', async () => {
    offeredParties(PARTY_ID)

    await submit(
      { ...applicant, actorNationalId: '0202020000', involvedPartyIds: [] },
      PARTY_ID,
    )

    expect(getCreateCaseBody).toHaveBeenCalled()
    expect(getInvolvedPartiesByNationalId).toHaveBeenCalledWith(
      '0101010000',
      '0202020000',
    )
  })

  it('refuses a party sharing the applicant national id that the picker does not offer', async () => {
    offeredParties(OTHER_PARTY_ID)

    const result = await submit(
      { ...applicant, actorNationalId: '0202020000', involvedPartyIds: [] },
      PARTY_ID,
    )

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
  })

  it('answers an unknown institution with the same 403 as any other refusal', async () => {
    getInvolvedPartiesByNationalId.mockResolvedValue(
      ResultWrapper.err({ code: 404, message: 'Involved party not found' }),
    )

    const result = await submit(applicant, PARTY_ID)

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
    expect(institutionLookup).not.toHaveBeenCalled()
  })

  it('refuses a malformed institution id with the same 403, before any lookup', async () => {
    const result = await submit({ ...applicant, isAdmin: true }, 'not-a-uuid')

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
    expect(getInvolvedPartiesByNationalId).not.toHaveBeenCalled()
  })

  it('lets an editorial admin file for an institution they are not linked to', async () => {
    await submit(
      { ...applicant, involvedPartyIds: [], isAdmin: true },
      PARTY_ID,
    )

    expect(getCreateCaseBody).toHaveBeenCalled()
    expect(getInvolvedPartiesByNationalId).not.toHaveBeenCalled()
  })

  it('does not let an admin file for an application they are not a party to', async () => {
    const result = await submit(
      { nationalId: '0909090000', isAdmin: true },
      PARTY_ID,
    )

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
  })

  it('refuses a caller who is not a party to the application, whatever their parties', async () => {
    const result = await submit(
      { nationalId: '0909090000', involvedPartyIds: [PARTY_ID] },
      PARTY_ID,
    )

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
  })

  it('refuses an application with no institution as a 400', async () => {
    const result = await submit(applicant, undefined)

    expectRefusal(result, 400, 'Stofnun vantar í umsókn')
  })

  it('passes an upstream failure through instead of calling it a refusal', async () => {
    getInvolvedPartiesByNationalId.mockResolvedValue(
      ResultWrapper.err({ code: 500, message: 'db down' }),
    )

    const result = await submit(applicant, PARTY_ID)

    expectRefusal(result, 500)
  })
})
