import { UserRoleEnum } from '@dmr.is/constants'
import {
  ApplicationOwnershipGuard,
  InvolvedPartyGuard,
  OwnInvolvedPartyGuard,
} from '@dmr.is/ojoi-modules'
import { ResultWrapper } from '@dmr.is/types'

import { ApplicationController } from './application.controller'

const guardsOf = (method: keyof ApplicationController) =>
  (Reflect.getMetadata('__guards__', ApplicationController.prototype[method]) ??
    []) as unknown[]

describe('ApplicationController guards', () => {
  it.each([
    'getPrice',
    'getApplication',
    'postApplication',
    'uploadApplicationAttachment',
    'getPresignedUrl',
    'addApplicationAttachment',
    'getApplicationAttachments',
    'deleteApplicationAttachment',
  ] as const)('%s requires the caller to be a party', (method) => {
    expect(guardsOf(method)).toContain(ApplicationOwnershipGuard)
  })

  it("limits the signature route to the caller's own involved parties", () => {
    expect(guardsOf('getSignaturesForInvolvedParty')).toContain(
      OwnInvolvedPartyGuard,
    )
  })

  it.each(['getComments', 'postComment', 'getApplicationCase'] as const)(
    '%s stays on the case-based involved party guard',
    (method) => {
      expect(guardsOf(method)).toEqual([InvolvedPartyGuard])
    },
  )
})

describe('ApplicationController.postApplication', () => {
  const application = { id: 'app-1' } as never
  const postApplication = jest.fn()
  const controller = new ApplicationController(
    { postApplication } as never,
    {} as never,
    {} as never,
    {} as never,
  )

  beforeEach(() => {
    jest.resetAllMocks()
    postApplication.mockResolvedValue(ResultWrapper.ok())
  })

  it('hands the service who is calling, not an empty caller', async () => {
    await controller.postApplication(application, {
      nationalId: '0101010000',
      actor: { nationalId: '0202020000' },
      role: { title: UserRoleEnum.Editor },
      involvedParties: [{ id: 'party-1' }],
    } as never)

    expect(postApplication).toHaveBeenCalledWith(application, {
      nationalId: '0101010000',
      involvedPartyIds: ['party-1'],
      isAdmin: false,
    })
  })

  it('marks an editorial admin', async () => {
    await controller.postApplication(application, {
      nationalId: '0101010000',
      role: { title: UserRoleEnum.Admin },
      involvedParties: ['party-1'],
    } as never)

    expect(postApplication).toHaveBeenCalledWith(
      application,
      expect.objectContaining({ isAdmin: true, involvedPartyIds: ['party-1'] }),
    )
  })
})

describe('ApplicationController handlers use the application the guard fetched', () => {
  const getPriceFromService = jest.fn()
  const getApplicationFromService = jest.fn()
  const controller = new ApplicationController(
    {
      getApplication: getApplicationFromService,
      getPrice: getPriceFromService,
    } as never,
    {} as never,
    {} as never,
    {} as never,
  )
  const application = { id: 'app-1' } as never

  beforeEach(() => jest.resetAllMocks())

  it('returns it from GET :id without reading the application again', () => {
    expect(controller.getApplication(application)).toEqual({ application })
    expect(getApplicationFromService).not.toHaveBeenCalled()
  })

  it('prices the same application', async () => {
    getPriceFromService.mockResolvedValue(ResultWrapper.ok({ price: 1 }))

    await controller.getPrice(application)

    expect(getPriceFromService).toHaveBeenCalledWith(application)
  })
})
