import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyStatusEnum } from '../company/models/company.enums'
import {
  CompanyEventModel,
  CompanyEventTypeEnum,
  CompanyReminderTierEnum,
} from '../company/models/company-event.model'
import { UserModel } from '../user/models/user.model'
import { CompanyEventService } from './company-event.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('CompanyEventService', () => {
  let service: CompanyEventService
  let create: jest.Mock
  let findAll: jest.Mock
  let findOne: jest.Mock

  beforeEach(async () => {
    create = jest.fn().mockResolvedValue({})
    findAll = jest.fn().mockResolvedValue([])
    findOne = jest.fn().mockResolvedValue(null)

    const module = await Test.createTestingModule({
      providers: [
        CompanyEventService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(CompanyEventModel),
          useValue: { create, findAll, findOne },
        },
      ],
    }).compile()

    service = module.get(CompanyEventService)
  })

  it('emitCreated inserts a CREATED row with the initial status and no transition', async () => {
    await service.emitCreated('company-1', CompanyStatusEnum.ACTIVE)

    expect(create).toHaveBeenCalledWith({
      companyId: 'company-1',
      eventType: CompanyEventTypeEnum.CREATED,
      actorUserId: null,
      status: CompanyStatusEnum.ACTIVE,
    })
  })

  it('emitStatusChanged snapshots the new status and records from/to + reason', async () => {
    await service.emitStatusChanged(
      'company-1',
      CompanyStatusEnum.ACTIVE,
      CompanyStatusEnum.INACTIVE,
      'admin-1',
      'merger',
    )

    expect(create).toHaveBeenCalledWith({
      companyId: 'company-1',
      eventType: CompanyEventTypeEnum.STATUS_CHANGED,
      actorUserId: 'admin-1',
      status: CompanyStatusEnum.INACTIVE,
      fromStatus: CompanyStatusEnum.ACTIVE,
      toStatus: CompanyStatusEnum.INACTIVE,
      reason: 'merger',
    })
  })

  it('getByCompanyId returns mapped DTOs ordered oldest first', async () => {
    findAll.mockResolvedValue([
      { fromModel: () => ({ id: 'e1' }) },
      { fromModel: () => ({ id: 'e2' }) },
    ])

    const result = await service.getByCompanyId('company-1')

    expect(findAll).toHaveBeenCalledWith({
      where: { companyId: 'company-1' },
      include: [{ model: UserModel, as: 'actor', required: false }],
      order: [['createdAt', 'ASC']],
    })
    expect(result).toEqual([{ id: 'e1' }, { id: 'e2' }])
  })

  it('hasDeadlineReminderEvent keys the lookup on tier and due date', async () => {
    findOne.mockResolvedValue({ id: 'e1' })

    const result = await service.hasDeadlineReminderEvent(
      'company-1',
      CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT,
      CompanyReminderTierEnum.TWO_WEEKS,
      '2026-12-01T00:00:00.000Z',
    )

    expect(findOne).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        eventType: CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT,
        reminderTier: CompanyReminderTierEnum.TWO_WEEKS,
        reason: '2026-12-01T00:00:00.000Z',
      },
      attributes: ['id'],
    })
    expect(result).toBe(true)
  })

  it('emitDeadlineReminderEvent stores the tier and due date', async () => {
    await service.emitDeadlineReminderEvent(
      'company-1',
      CompanyStatusEnum.ACTIVE,
      CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
      CompanyReminderTierEnum.DUE,
      '2026-12-01T00:00:00.000Z',
    )

    expect(create).toHaveBeenCalledWith({
      companyId: 'company-1',
      eventType: CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
      status: CompanyStatusEnum.ACTIVE,
      reason: '2026-12-01T00:00:00.000Z',
      reminderTier: CompanyReminderTierEnum.DUE,
    })
  })
})
