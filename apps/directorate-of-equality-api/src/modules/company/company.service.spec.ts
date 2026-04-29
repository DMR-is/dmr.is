import { NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from './models/company.model'
import { CompanyService } from './company.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('CompanyService', () => {
  let service: CompanyService
  let findOne: jest.Mock

  beforeEach(async () => {
    findOne = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(CompanyModel),
          useValue: { findOne },
        },
      ],
    }).compile()

    service = module.get(CompanyService)
  })

  it('returns the company DTO when one is found by national id', async () => {
    findOne.mockResolvedValue({
      fromModel: () => ({
        id: 'company-1',
        name: 'Acme ehf.',
        nationalId: '5501234567',
      }),
    })

    const result = await service.getByNationalId('5501234567')

    expect(findOne).toHaveBeenCalledWith({
      where: { nationalId: '5501234567' },
    })
    expect(result).toEqual({
      id: 'company-1',
      name: 'Acme ehf.',
      nationalId: '5501234567',
    })
  })

  it('throws NotFoundException when no company matches the national id', async () => {
    findOne.mockResolvedValue(null)

    await expect(service.getByNationalId('0000000000')).rejects.toThrow(
      NotFoundException,
    )
  })
})
