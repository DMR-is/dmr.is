import { ResultWrapper } from '@dmr.is/types'

import { ApplicationCaller } from '../../../auth/application-party'
import { CaseCreateService } from './case-create.service'

const PARTY_ID = '6f1c1a3e-2b4d-4c5e-9f60-7a8b9c0d1e2f'
const OTHER_PARTY_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d'
const FORBIDDEN_MESSAGE =
  'Þú hefur ekki heimild til að senda inn fyrir þessa stofnun'

const applicationWith = (involvedPartyId?: string) => ({
  id: 'app-1',
  applicant: '010101-0000',
  assignees: [],
  answers: { advert: { involvedPartyId } },
})

const applicant = { nationalId: '0101010000' }
const APPLICANT_DIGITS = '0101010000'

describe('CaseCreateService.createCaseByApplication involved party', () => {
  const getInvolvedPartiesByNationalId = jest.fn()
  const getUserByNationalId = jest.fn()
  const getInvolvedPartiesByUser = jest.fn()
  const institutionLookup = jest.fn()
  const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() }

  // Only the first three constructor dependencies are reached before the
  // party check; getCreateCaseBody is stubbed to stop right after it.
  const service = new (CaseCreateService as unknown as new (
    ...args: unknown[]
  ) => CaseCreateService)(
    logger,
    { institutionLookup },
    {
      getInvolvedPartiesByNationalId,
      getUserByNationalId,
      getInvolvedPartiesByUser,
    },
  )
  let getCreateCaseBody: jest.SpyInstance

  const offeredParties = (...ids: string[]) =>
    getInvolvedPartiesByNationalId.mockResolvedValue(
      ResultWrapper.ok({ involvedParties: ids.map((id) => ({ id })) }),
    )

  const submit = (caller: ApplicationCaller, involvedPartyId?: string) => {
    return service.createCaseByApplication(
      applicationWith(involvedPartyId) as never,
      caller,
    )
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

  it('refuses the applicant an institution outside their own parties, without a lookup', async () => {
    offeredParties(PARTY_ID)

    const result = await submit(
      {
        ...applicant,
        involvedPartyIds: [OTHER_PARTY_ID],
      },
      PARTY_ID,
    )

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
    expect(getInvolvedPartiesByNationalId).not.toHaveBeenCalled()
  })

  it('refuses an individual applicant a party merely registered under their national id', async () => {
    offeredParties(PARTY_ID)

    const result = await submit(
      { ...applicant, involvedPartyIds: [] },
      PARTY_ID,
    )

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
    expect(getInvolvedPartiesByNationalId).not.toHaveBeenCalled()
  })

  describe('an assignee', () => {
    const assignee = { nationalId: '020202-0000' }
    const APPLICANT_USER = { id: 'applicant-user' }
    const submitAsAssignee = (
      caller: ApplicationCaller,
      involvedPartyId: string,
      applicantActors: string[] = [],
    ) =>
      service.createCaseByApplication(
        {
          ...applicationWith(involvedPartyId),
          assignees: [assignee.nationalId],
          applicantActors,
        } as never,
        caller,
      )
    const personApplicantOffered = (...ids: string[]) => {
      getUserByNationalId.mockResolvedValue(
        ResultWrapper.ok({ user: APPLICANT_USER }),
      )
      getInvolvedPartiesByUser.mockResolvedValue(
        ResultWrapper.ok({ involvedParties: ids.map((id) => ({ id })) }),
      )
    }

    it('may file for one of their own parties, without looking up the applicant', async () => {
      await submitAsAssignee(
        { ...assignee, involvedPartyIds: [OTHER_PARTY_ID, PARTY_ID] },
        PARTY_ID,
      )

      expect(getCreateCaseBody).toHaveBeenCalled()
      expect(getUserByNationalId).not.toHaveBeenCalled()
      expect(getInvolvedPartiesByNationalId).not.toHaveBeenCalled()
    })

    it('may file for what the picker offered an applicant signed in as themselves', async () => {
      personApplicantOffered(OTHER_PARTY_ID, PARTY_ID)

      await submitAsAssignee({ ...assignee, involvedPartyIds: [] }, PARTY_ID)

      expect(getCreateCaseBody).toHaveBeenCalled()
      expect(getUserByNationalId).toHaveBeenCalledWith(APPLICANT_DIGITS)
      expect(getInvolvedPartiesByUser).toHaveBeenCalledWith(APPLICANT_USER)
      expect(getInvolvedPartiesByNationalId).not.toHaveBeenCalled()
    })

    it('may file for what the picker offered a delegate applicant, through any recorded actor', async () => {
      // Only the second actor was offered the institution
      getInvolvedPartiesByNationalId.mockImplementation(
        async (_nationalId: string, actor?: string) =>
          ResultWrapper.ok({
            involvedParties: [
              { id: actor === '0404040000' ? PARTY_ID : OTHER_PARTY_ID },
            ],
          }),
      )

      await submitAsAssignee({ ...assignee, involvedPartyIds: [] }, PARTY_ID, [
        '030303-0000',
        '040404-0000',
      ])

      expect(getCreateCaseBody).toHaveBeenCalled()
      expect(getInvolvedPartiesByNationalId).toHaveBeenCalledWith(
        APPLICANT_DIGITS,
        '0303030000',
      )
      expect(getInvolvedPartiesByNationalId).toHaveBeenCalledWith(
        APPLICANT_DIGITS,
        '0404040000',
      )
      expect(getUserByNationalId).not.toHaveBeenCalled()
    })

    it('is refused an institution the applicant could not have picked', async () => {
      personApplicantOffered(OTHER_PARTY_ID)

      const result = await submitAsAssignee(
        { ...assignee, involvedPartyIds: [] },
        PARTY_ID,
      )

      expectRefusal(result, 403, FORBIDDEN_MESSAGE)
    })

    it('is refused when a delegate applicant was offered nothing', async () => {
      getInvolvedPartiesByNationalId.mockResolvedValue(
        ResultWrapper.err({ code: 404, message: 'Involved party not found' }),
      )

      const result = await submitAsAssignee(
        { ...assignee, involvedPartyIds: [] },
        PARTY_ID,
        ['030303-0000'],
      )

      expectRefusal(result, 403, FORBIDDEN_MESSAGE)
    })

    it('is refused when the applicant is not a user here', async () => {
      getUserByNationalId.mockResolvedValue(
        ResultWrapper.err({ code: 404, message: 'User not found' }),
      )

      const result = await submitAsAssignee(
        { ...assignee, involvedPartyIds: [] },
        PARTY_ID,
      )

      expectRefusal(result, 403, FORBIDDEN_MESSAGE)
      expect(getInvolvedPartiesByUser).not.toHaveBeenCalled()
    })

    it('passes an upstream failure through instead of calling it a refusal', async () => {
      getUserByNationalId.mockResolvedValue(
        ResultWrapper.ok({ user: APPLICANT_USER }),
      )
      getInvolvedPartiesByUser.mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'db down' }),
      )

      const result = await submitAsAssignee(
        { ...assignee, involvedPartyIds: [] },
        PARTY_ID,
      )

      expectRefusal(result, 500)
    })
  })

  it("answers an institution outside the caller's parties with the same 403, without looking it up", async () => {
    const result = await submit(
      { ...applicant, involvedPartyIds: [OTHER_PARTY_ID] },
      PARTY_ID,
    )

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
      { nationalId: '090909-0000', isAdmin: true },
      PARTY_ID,
    )

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
  })

  it('refuses a caller who is not a party to the application, whatever their parties', async () => {
    const result = await submit(
      { nationalId: '090909-0000', involvedPartyIds: [PARTY_ID] },
      PARTY_ID,
    )

    expectRefusal(result, 403, FORBIDDEN_MESSAGE)
  })

  it('refuses an application with no institution as a 400', async () => {
    const result = await submit(applicant, undefined)

    expectRefusal(result, 400, 'Stofnun vantar í umsókn')
  })
})
