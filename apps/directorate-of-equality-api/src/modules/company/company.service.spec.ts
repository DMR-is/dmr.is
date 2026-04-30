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
  let findOneOrThrow: jest.Mock

  beforeEach(async () => {
    findOneOrThrow = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(CompanyModel),
          useValue: { findOneOrThrow },
        },
      ],
    }).compile()

    service = module.get(CompanyService)
  })

  it('returns the company DTO when one is found by national id', async () => {
    findOneOrThrow.mockResolvedValue({
      fromModel: () => ({
        id: 'company-1',
        name: 'Acme ehf.',
        nationalId: '5501234567',
      }),
    })

    const result = await service.getByNationalId('5501234567')

    expect(findOneOrThrow).toHaveBeenCalledWith(
      { where: { nationalId: '5501234567' } },
      'Company with national id "5501234567" not found',
    )
    expect(result).toEqual({
      id: 'company-1',
      name: 'Acme ehf.',
      nationalId: '5501234567',
    })
  })

  it('throws NotFoundException when no company matches the national id', async () => {
    findOneOrThrow.mockRejectedValue(new NotFoundException())

    await expect(service.getByNationalId('0000000000')).rejects.toThrow(
      NotFoundException,
    )
  })
})
