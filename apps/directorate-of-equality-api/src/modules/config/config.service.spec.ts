import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { getConnectionToken, getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ConfigModel } from './models/config.model'
import { SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY as THRESHOLD_KEY } from './config.constants'
import { ConfigService } from './config.service'

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
  let transaction: jest.Mock

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
    transaction = jest.fn().mockImplementation((cb) => cb('tx'))

    const module = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: getConnectionToken(), useValue: { transaction } },
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

    expect(update).toHaveBeenCalledWith(
      { supersededAt: expect.any(Date) },
      { transaction: 'tx' },
    )
    expect(create).toHaveBeenCalledWith(
      {
        key: THRESHOLD_KEY,
        value: '3.5',
        description: 'Annual threshold',
      },
      { transaction: 'tx' },
    )
    expect(result).toEqual(
      expect.objectContaining({ key: THRESHOLD_KEY, value: '3.5' }),
    )
  })

  it('runs the supersede and the insert inside one transaction, with the active row locked', async () => {
    findOne.mockResolvedValue(currentEntry('3.9'))

    await service.updateByKey(THRESHOLD_KEY, { value: '3.5' })

    expect(transaction).toHaveBeenCalledTimes(1)
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: 'UPDATE', transaction: 'tx' }),
    )
  })

  it('rejects raising the threshold without touching the active entry', async () => {
    findOne.mockResolvedValue(currentEntry('3.9'))

    await expect(
      service.updateByKey(THRESHOLD_KEY, { value: '4.5' }),
    ).rejects.toThrow(/may only be lowered/)

    expect(update).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it('rejects re-submitting the threshold unchanged', async () => {
    findOne.mockResolvedValue(currentEntry('3.9'))

    await expect(
      service.updateByKey(THRESHOLD_KEY, { value: '3.9' }),
    ).rejects.toThrow(/may only be lowered/)

    expect(create).not.toHaveBeenCalled()
  })

  it.each([
    '',
    '   ',
    '0',
    '-1',
    'lower it',
    // Number('0x2') is 2 and would pass a lower-than check, but every reader
    // calls parseFloat, which reads it as 0 — an accidental zero threshold.
    '0x2',
    '1e0',
    // DECIMAL(5, 2) storage: a third decimal could not round-trip.
    '3.999',
    '3,5',
    '3.5%',
    ' 3.5 kr',
  ])('rejects "%s" as a threshold value', async (value) => {
    findOne.mockResolvedValue(currentEntry('3.9'))

    await expect(service.updateByKey(THRESHOLD_KEY, { value })).rejects.toThrow(
      BadRequestException,
    )

    expect(create).not.toHaveBeenCalled()
  })

  it('normalizes the stored value so readers get back exactly what was validated', async () => {
    findOne.mockResolvedValue(currentEntry('3.9'))

    await service.updateByKey(THRESHOLD_KEY, { value: ' 3.50 ' })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ value: '3.5' }),
      { transaction: 'tx' },
    )
  })

  it.each(['3,9', '3.9%', 'four'])(
    'refuses to update when the active value "%s" cannot be parsed',
    async (current) => {
      findOne.mockResolvedValue(currentEntry(current))

      // Fail closed: an unparseable active value used to switch the ratchet off
      // entirely, so any value — including a higher one — was accepted.
      await expect(
        service.updateByKey(THRESHOLD_KEY, { value: '99' }),
      ).rejects.toThrow(InternalServerErrorException)

      expect(update).not.toHaveBeenCalled()
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

    expect(create).toHaveBeenCalledWith(
      {
        key: 'some_other_key',
        value: '999',
        description: null,
      },
      { transaction: 'tx' },
    )
  })

  it('surfaces a NotFound when the key has no active entry', async () => {
    findOne.mockResolvedValue(null)

    await expect(
      service.updateByKey(THRESHOLD_KEY, { value: '3.5' }),
    ).rejects.toThrow(NotFoundException)
  })
})
