import { BadRequestException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { AdvertModel } from '../../../models/advert.model'
import {
  CreateSignatureDto,
  SignatureModel,
  UpdateSignatureDto,
} from '../../../models/signature.model'
import { StatusIdEnum } from '../../../models/status.model'
import { SignatureService } from './signature.service'
// ==========================================
// Mock Factories
// ==========================================
interface MockAdvert {
  id: string
  statusId: StatusIdEnum
}
const createMockAdvert = (overrides: Partial<MockAdvert> = {}): MockAdvert => ({
  id: overrides.id || 'advert-123',
  statusId: overrides.statusId || StatusIdEnum.SUBMITTED,
})
interface MockSignature {
  id: string
  advertId: string
  name: string | null
  location: string | null
  date: Date | null
  onBehalfOf: string | null
  advert?: MockAdvert
  update: jest.Mock
  fromModel: jest.Mock
}
const createMockSignature = (
  overrides: Partial<MockSignature> = {},
): MockSignature => {
  const signature: MockSignature = {
    id: overrides.id || 'signature-123',
    advertId: overrides.advertId || 'advert-123',
    name: overrides.name ?? 'Test Signer',
    location: overrides.location ?? 'Reykjavik',
    date: overrides.date ?? new Date('2024-01-01'),
    onBehalfOf: overrides.onBehalfOf ?? null,
    advert: overrides.advert,
    update: jest.fn(),
    fromModel: jest.fn(),
  }
  signature.update.mockImplementation((updates: Partial<MockSignature>) => {
    Object.assign(signature, updates)
    return Promise.resolve(signature)
  })
  signature.fromModel.mockReturnValue({
    id: signature.id,
    advertId: signature.advertId,
    name: signature.name,
    location: signature.location,
    date: signature.date?.toISOString(),
    onBehalfOf: signature.onBehalfOf,
  })
  return signature
}
// ==========================================
// Tests
// ==========================================
describe('SignatureService - Status Protection', () => {
  let service: SignatureService
  let signatureModel: jest.Mocked<typeof SignatureModel>
  let advertModel: jest.Mocked<typeof AdvertModel>
  beforeEach(async () => {
    const mockSignatureModel = {
      findOneOrThrow: jest.fn(),
      create: jest.fn(),
    }
    const mockAdvertModel = {
      findByPkOrThrow: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignatureService,
        {
          provide: getModelToken(SignatureModel),
          useValue: mockSignatureModel,
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
      ],
    }).compile()
    service = module.get<SignatureService>(SignatureService)
    signatureModel = module.get(getModelToken(SignatureModel))
    advertModel = module.get(getModelToken(AdvertModel))
  })
  describe('createSignature', () => {
    const createDto: CreateSignatureDto = {
      name: 'New Signer',
      location: 'Reykjavik',
      date: new Date('2024-01-15'),
      onBehalfOf: 'Test Company',
    }
    it('should allow creation when advert is editable (SUBMITTED)', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.SUBMITTED })
      const signature = createMockSignature()
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      signatureModel.create.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await expect(
        service.createSignature('advert-123', createDto),
      ).resolves.not.toThrow()
      expect(signatureModel.create).toHaveBeenCalled()
    })
    it('should allow creation when advert is IN_PROGRESS', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.IN_PROGRESS })
      const signature = createMockSignature()
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      signatureModel.create.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await expect(
        service.createSignature('advert-123', createDto),
      ).resolves.not.toThrow()
    })
    it('should throw BadRequestException when advert is PUBLISHED', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.PUBLISHED })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.createSignature('advert-123', createDto),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.createSignature('advert-123', createDto),
      ).rejects.toThrow(
        'Cannot modify signature - advert is in a terminal state',
      )
      expect(signatureModel.create).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is REJECTED', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.REJECTED })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.createSignature('advert-123', createDto),
      ).rejects.toThrow(BadRequestException)
      expect(signatureModel.create).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is WITHDRAWN', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.WITHDRAWN })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.createSignature('advert-123', createDto),
      ).rejects.toThrow(BadRequestException)
      expect(signatureModel.create).not.toHaveBeenCalled()
    })
    it('should fetch advert with statusId attribute before creation', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.SUBMITTED })
      const signature = createMockSignature()
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      signatureModel.create.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await service.createSignature('advert-123', createDto)
      expect(advertModel.findByPkOrThrow).toHaveBeenCalledWith('advert-123', {
        attributes: ['id', 'statusId'],
      })
    })
  })
  describe('updateSignature', () => {
    const updateDto: UpdateSignatureDto = {
      name: 'Updated Signer',
      location: 'Updated Location',
    }
    it('should allow update when advert is editable (SUBMITTED)', async () => {
      const signature = createMockSignature({
        advert: createMockAdvert({ statusId: StatusIdEnum.SUBMITTED }),
      })
      signatureModel.findOneOrThrow.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await expect(
        service.updateSignature('signature-123', 'advert-123', updateDto),
      ).resolves.not.toThrow()
      expect(signature.update).toHaveBeenCalledWith(updateDto)
    })
    it('should allow update when advert is READY_FOR_PUBLICATION', async () => {
      const signature = createMockSignature({
        advert: createMockAdvert({
          statusId: StatusIdEnum.READY_FOR_PUBLICATION,
        }),
      })
      signatureModel.findOneOrThrow.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await expect(
        service.updateSignature('signature-123', 'advert-123', updateDto),
      ).resolves.not.toThrow()
      expect(signature.update).toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is PUBLISHED', async () => {
      const signature = createMockSignature({
        advert: createMockAdvert({ statusId: StatusIdEnum.PUBLISHED }),
      })
      signatureModel.findOneOrThrow.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await expect(
        service.updateSignature('signature-123', 'advert-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.updateSignature('signature-123', 'advert-123', updateDto),
      ).rejects.toThrow(
        'Cannot modify signature - advert is in a terminal state',
      )
      expect(signature.update).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is REJECTED', async () => {
      const signature = createMockSignature({
        advert: createMockAdvert({ statusId: StatusIdEnum.REJECTED }),
      })
      signatureModel.findOneOrThrow.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await expect(
        service.updateSignature('signature-123', 'advert-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      expect(signature.update).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is WITHDRAWN', async () => {
      const signature = createMockSignature({
        advert: createMockAdvert({ statusId: StatusIdEnum.WITHDRAWN }),
      })
      signatureModel.findOneOrThrow.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await expect(
        service.updateSignature('signature-123', 'advert-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      expect(signature.update).not.toHaveBeenCalled()
    })
    it('should include advert in query with statusId attribute', async () => {
      const signature = createMockSignature({
        advert: createMockAdvert({ statusId: StatusIdEnum.SUBMITTED }),
      })
      signatureModel.findOneOrThrow.mockResolvedValue(
        signature as unknown as SignatureModel,
      )
      await service.updateSignature('signature-123', 'advert-123', updateDto)
      expect(signatureModel.findOneOrThrow).toHaveBeenCalledWith({
        where: { id: 'signature-123', advertId: 'advert-123' },
        include: [
          expect.objectContaining({
            model: AdvertModel,
            attributes: ['id', 'statusId'],
          }),
        ],
      })
    })
  })
})
