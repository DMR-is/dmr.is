import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../../../models/advert.model'
import {
  ApplicationModel,
  ApplicationStatusEnum,
} from '../../../../models/application.model'
import { TypeIdEnum } from '../../../../models/type.model'
import { AdvertPublishedEvent } from '../events/advert-published.event'
import { DivisionEndingPublishedListener } from './division-ending-published.listener'

describe('DivisionEndingPublishedListener', () => {
  let listener: DivisionEndingPublishedListener
  let advertModel: { findOne: jest.Mock }
  let applicationModel: { update: jest.Mock }

  const ADVERT_ID = 'advert-123'
  const APPLICATION_ID = 'application-123'

  const createMockEvent = (): AdvertPublishedEvent =>
    ({
      advert: { id: ADVERT_ID },
      publication: { id: 'publication-123' },
      html: '<html></html>',
    }) as unknown as AdvertPublishedEvent

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DivisionEndingPublishedListener,
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getModelToken(ApplicationModel),
          useValue: { update: jest.fn() },
        },
      ],
    }).compile()

    listener = module.get(DivisionEndingPublishedListener)
    advertModel = module.get(getModelToken(AdvertModel))
    applicationModel = module.get(getModelToken(ApplicationModel))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should close the estate when a division ending publishes', async () => {
    advertModel.findOne.mockResolvedValue({
      id: ADVERT_ID,
      applicationId: APPLICATION_ID,
    })

    await listener.closeEstate(createMockEvent())

    expect(applicationModel.update).toHaveBeenCalledWith(
      { status: ApplicationStatusEnum.FINISHED },
      { where: { id: APPLICATION_ID } },
    )
  })

  it('should match the division ending by type in the query', async () => {
    advertModel.findOne.mockResolvedValue(null)

    await listener.closeEstate(createMockEvent())

    expect(advertModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ADVERT_ID, typeId: TypeIdEnum.DIVISION_ENDING },
      }),
    )
  })

  it('should ignore adverts that are not division endings', async () => {
    advertModel.findOne.mockResolvedValue(null)

    await listener.closeEstate(createMockEvent())

    expect(applicationModel.update).not.toHaveBeenCalled()
  })

  it('should ignore a division ending that has no application', async () => {
    advertModel.findOne.mockResolvedValue({
      id: ADVERT_ID,
      applicationId: null,
    })

    await listener.closeEstate(createMockEvent())

    expect(applicationModel.update).not.toHaveBeenCalled()
  })
})
