import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import { CompanyCommentModel } from '../company/models/company-comment.model'
import { CompanyCommentService } from './company-comment.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('CompanyCommentService', () => {
  let service: CompanyCommentService
  let commentCreate: jest.Mock
  let commentFindAll: jest.Mock
  let commentFindOneOrThrow: jest.Mock
  let companyFindOneOrThrow: jest.Mock

  beforeEach(async () => {
    commentCreate = jest.fn()
    commentFindAll = jest.fn().mockResolvedValue([])
    commentFindOneOrThrow = jest.fn()
    companyFindOneOrThrow = jest.fn().mockResolvedValue({ id: 'company-1' })

    const module = await Test.createTestingModule({
      providers: [
        CompanyCommentService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(CompanyCommentModel),
          useValue: {
            create: commentCreate,
            findAll: commentFindAll,
            findOneOrThrow: commentFindOneOrThrow,
          },
        },
        {
          provide: getModelToken(CompanyModel),
          useValue: { findOneOrThrow: companyFindOneOrThrow },
        },
      ],
    }).compile()

    service = module.get(CompanyCommentService)
  })

  it('create trims the body and inserts an admin-authored comment', async () => {
    commentCreate.mockResolvedValue({ fromModel: () => ({ id: 'comment-1' }) })

    const result = await service.create('company-1', 'admin-1', {
      body: '  needs follow-up  ',
    })

    expect(companyFindOneOrThrow).toHaveBeenCalled()
    expect(commentCreate).toHaveBeenCalledWith({
      companyId: 'company-1',
      authorUserId: 'admin-1',
      body: 'needs follow-up',
    })
    expect(result).toEqual({ id: 'comment-1' })
  })

  it('create rejects an empty body before touching the company', async () => {
    await expect(
      service.create('company-1', 'admin-1', { body: '   ' }),
    ).rejects.toThrow(BadRequestException)

    expect(companyFindOneOrThrow).not.toHaveBeenCalled()
    expect(commentCreate).not.toHaveBeenCalled()
  })

  it('create surfaces a NotFound when the company does not exist', async () => {
    companyFindOneOrThrow.mockRejectedValue(new NotFoundException())

    await expect(
      service.create('missing', 'admin-1', { body: 'note' }),
    ).rejects.toThrow(NotFoundException)

    expect(commentCreate).not.toHaveBeenCalled()
  })

  it('getByCompanyId returns mapped DTOs ordered oldest first', async () => {
    commentFindAll.mockResolvedValue([
      { fromModel: () => ({ id: 'c1' }) },
      { fromModel: () => ({ id: 'c2' }) },
    ])

    const result = await service.getByCompanyId('company-1')

    expect(commentFindAll).toHaveBeenCalledWith({
      where: { companyId: 'company-1' },
      order: [['createdAt', 'ASC']],
    })
    expect(result).toEqual([{ id: 'c1' }, { id: 'c2' }])
  })

  it('delete soft-deletes the comment scoped to its company', async () => {
    const destroy = jest.fn()
    commentFindOneOrThrow.mockResolvedValue({ destroy })

    await service.delete('company-1', 'comment-1')

    expect(commentFindOneOrThrow).toHaveBeenCalledWith(
      { where: { id: 'comment-1', companyId: 'company-1' } },
      expect.any(String),
    )
    expect(destroy).toHaveBeenCalled()
  })
})
