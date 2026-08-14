import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ConfigModel } from './models/config.model'
import { ConfigService } from './config.service'

const THRESHOLD_KEY = 'salary_difference_threshold_percent'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ConfigService', () => {
  let service: ConfigService
  let findOne: jest.Mock
  let findAll: jest.Mock
  let create: jest.Mock
  let update: jest.Mock

  const currentEntry = (value: string) => ({
    key: THRESHOLD_KEY,
    value,
    description: 'Annual threshold',
    update,
  })

  beforeEach(async () => {
    findOne = jest.fn()
    findAll = jest.fn().mockResolvedValue([])
    update = jest.fn()
    create = jest.fn().mockImplementation((attributes) => ({
      fromModel: () => ({ id: 'config-2', ...attributes }),
    }))

    const module = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ConfigModel),
          useValue: { findOne, findAll, create },
        },
      ],
    }).compile()

    service = module.get(ConfigService)
  })

  it('supersedes the active entry and inserts the lowered threshold', async () => {
    findOne.mockResolvedValue(currentEntry('3.9'))

    const result = await service.updateByKey(THRESHOLD_KEY, { value: '3.5' })

    expect(update).toHaveBeenCalledWith({ supersededAt: expect.any(Date) })
    expect(create).toHaveBeenCalledWith({
      key: THRESHOLD_KEY,
      value: '3.5',
      description: 'Annual threshold',
    })
    expect(result).toEqual(
      expect.objectContaining({ key: THRESHOLD_KEY, value: '3.5' }),
    )
  })

  it('rejects raising the threshold without touching the active entry', async () => {
    findOne.mockResolvedValue(currentEntry('3.9'))

    await expect(
      service.updateByKey(THRESHOLD_KEY, { value: '4.5' }),
    ).rejects.toThrow(BadRequestException)

    expect(update).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it('rejects re-submitting the threshold unchanged', async () => {
    findOne.mockResolvedValue(currentEntry('3.9'))

    await expect(
      service.updateByKey(THRESHOLD_KEY, { value: '3.9' }),
    ).rejects.toThrow(BadRequestException)

    expect(create).not.toHaveBeenCalled()
  })

  it.each(['', '   ', '0', '-1', 'lower it'])(
    'rejects "%s" as a threshold value',
    async (value) => {
      findOne.mockResolvedValue(currentEntry('3.9'))

      await expect(
        service.updateByKey(THRESHOLD_KEY, { value }),
      ).rejects.toThrow(BadRequestException)

      expect(create).not.toHaveBeenCalled()
    },
  )

  it('leaves other config keys unconstrained', async () => {
    findOne.mockResolvedValue({
      key: 'some_other_key',
      value: '1',
      description: null,
      update,
    })

    await service.updateByKey('some_other_key', { value: '999' })

    expect(create).toHaveBeenCalledWith({
      key: 'some_other_key',
      value: '999',
      description: null,
    })
  })

  it('surfaces a NotFound when the key has no active entry', async () => {
    findOne.mockResolvedValue(null)

    await expect(
      service.updateByKey(THRESHOLD_KEY, { value: '3.5' }),
    ).rejects.toThrow(NotFoundException)
  })
})
