import { Op } from 'sequelize'

import { Application } from '@dmr.is/shared-dto'

import { AdvertInvolvedPartyModel } from '../journal/models/advert-involved-party.model'
import { AdditionalPartiesService } from './additional-parties.service'
import { AdditionalPartiesModel } from './models'

describe('AdditionalPartiesService', () => {
  it('selects one primary involved party per assignee national id and excludes the primary party national id', async () => {
    const logger = {
      warn: jest.fn(),
    }
    const additionalPartiesModel = {
      findAll: jest.fn().mockResolvedValue([]),
      destroy: jest.fn().mockResolvedValue(0),
      bulkCreate: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    }
    const involvedPartyModel = {
      findByPk: jest.fn().mockResolvedValue({
        id: 'primary-party-id',
        nationalId: '010101-1234',
      }),
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'primary-party-alternate-id',
          nationalId: '0101011234',
          isPrimary: true,
        },
        {
          id: 'additional-party-secondary-id',
          nationalId: '0202021234',
          isPrimary: false,
        },
        {
          id: 'additional-party-primary-id',
          nationalId: '020202-1234',
          isPrimary: true,
        },
      ]),
    }

    const service = new AdditionalPartiesService(
      logger as ConstructorParameters<typeof AdditionalPartiesService>[0],
      additionalPartiesModel as unknown as typeof AdditionalPartiesModel,
      involvedPartyModel as unknown as typeof AdvertInvolvedPartyModel,
    )

    await service.syncCaseAdditionalParties('case-id', {
      assignees: ['0101011234', '0202021234'],
      answers: {
        advert: {
          involvedPartyId: 'primary-party-id',
        },
      },
    } as unknown as Application)

    const findAllCall = involvedPartyModel.findAll.mock.calls[0][0]
    const nationalIdWhere = findAllCall.where.nationalId as Record<
      symbol,
      string[]
    >

    expect(nationalIdWhere[Op.in]).toEqual(['0202021234', '020202-1234'])
    expect(additionalPartiesModel.bulkCreate).toHaveBeenCalledWith(
      [
        {
          caseId: 'case-id',
          advertId: null,
          involvedPartyId: 'additional-party-primary-id',
        },
      ],
      { transaction: undefined },
    )
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
