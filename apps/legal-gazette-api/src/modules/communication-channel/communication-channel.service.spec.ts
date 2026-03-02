import { BadRequestException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { AdvertModel } from '../../models/advert.model'
import {
  CommunicationChannelModel,
} from '../../models/communication-channel.model'
import { StatusIdEnum } from '../../models/status.model'
import {
  CreateCommunicationChannelDto,
  UpdateCommunicationChannelDto,
} from './dto/communication-channel.dto'
import { CommunicationChannelService } from './communication-channel.service'
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
interface MockChannel {
  id: string
  advertId: string
  email: string
  name: string | null
  phone: string | null
  advert?: MockAdvert
  update: jest.Mock
  fromModel: jest.Mock
}
const createMockChannel = (
  overrides: Partial<MockChannel> = {},
): MockChannel => {
  const channel: MockChannel = {
    id: overrides.id || 'channel-123',
    advertId: overrides.advertId || 'advert-123',
    email: overrides.email || 'test@example.com',
    name: overrides.name ?? 'Test Contact',
    phone: overrides.phone ?? '+3545551234',
    advert: overrides.advert,
    update: jest.fn(),
    fromModel: jest.fn(),
  }
  channel.update.mockImplementation((updates: Partial<MockChannel>) => {
    Object.assign(channel, updates)
    return Promise.resolve(channel)
  })
  channel.fromModel.mockReturnValue({
    id: channel.id,
    advertId: channel.advertId,
    email: channel.email,
    name: channel.name,
    phone: channel.phone,
  })
  return channel
}
// ==========================================
// Tests
// ==========================================
describe('CommunicationChannelService - Status Protection', () => {
  let service: CommunicationChannelService
  let channelModel: jest.Mocked<typeof CommunicationChannelModel>
  let advertModel: jest.Mocked<typeof AdvertModel>
  beforeEach(async () => {
    const mockChannelModel = {
      create: jest.fn(),
      destroy: jest.fn(),
      findOneOrThrow: jest.fn(),
    }
    const mockAdvertModel = {
      findByPkOrThrow: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationChannelService,
        {
          provide: getModelToken(CommunicationChannelModel),
          useValue: mockChannelModel,
        },
        {
          provide: getModelToken(AdvertModel),
          useValue: mockAdvertModel,
        },
      ],
    }).compile()
    service = module.get<CommunicationChannelService>(
      CommunicationChannelService,
    )
    channelModel = module.get(getModelToken(CommunicationChannelModel))
    advertModel = module.get(getModelToken(AdvertModel))
  })
  describe('createChannel', () => {
    const createDto: CreateCommunicationChannelDto = {
      email: 'new@example.com',
      name: 'New Contact',
      phone: '+3545559999',
    }
    it('should allow creation when advert is editable (SUBMITTED)', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.SUBMITTED })
      const channel = createMockChannel()
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      channelModel.create.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await expect(
        service.createChannel('advert-123', createDto),
      ).resolves.not.toThrow()
      expect(channelModel.create).toHaveBeenCalled()
    })
    it('should allow creation when advert is IN_PROGRESS', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.IN_PROGRESS })
      const channel = createMockChannel()
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      channelModel.create.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await expect(
        service.createChannel('advert-123', createDto),
      ).resolves.not.toThrow()
    })
    it('should throw BadRequestException when advert is PUBLISHED', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.PUBLISHED })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.createChannel('advert-123', createDto),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.createChannel('advert-123', createDto),
      ).rejects.toThrow(
        'Cannot modify communication channel - advert is in a terminal state',
      )
      expect(channelModel.create).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is REJECTED', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.REJECTED })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.createChannel('advert-123', createDto),
      ).rejects.toThrow(BadRequestException)
      expect(channelModel.create).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is WITHDRAWN', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.WITHDRAWN })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.createChannel('advert-123', createDto),
      ).rejects.toThrow(BadRequestException)
      expect(channelModel.create).not.toHaveBeenCalled()
    })
    it('should fetch advert with statusId attribute before creation', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.SUBMITTED })
      const channel = createMockChannel()
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      channelModel.create.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await service.createChannel('advert-123', createDto)
      expect(advertModel.findByPkOrThrow).toHaveBeenCalledWith('advert-123', {
        attributes: ['id', 'statusId'],
      })
    })
  })
  describe('updateChannel', () => {
    const updateDto: UpdateCommunicationChannelDto = {
      email: 'updated@example.com',
      name: 'Updated Contact',
    }
    it('should allow update when advert is editable (SUBMITTED)', async () => {
      const channel = createMockChannel({
        advert: createMockAdvert({ statusId: StatusIdEnum.SUBMITTED }),
      })
      channelModel.findOneOrThrow.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await expect(
        service.updateChannel('advert-123', 'channel-123', updateDto),
      ).resolves.not.toThrow()
      expect(channel.update).toHaveBeenCalled()
    })
    it('should allow update when advert is READY_FOR_PUBLICATION', async () => {
      const channel = createMockChannel({
        advert: createMockAdvert({
          statusId: StatusIdEnum.READY_FOR_PUBLICATION,
        }),
      })
      channelModel.findOneOrThrow.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await expect(
        service.updateChannel('advert-123', 'channel-123', updateDto),
      ).resolves.not.toThrow()
      expect(channel.update).toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is PUBLISHED', async () => {
      const channel = createMockChannel({
        advert: createMockAdvert({ statusId: StatusIdEnum.PUBLISHED }),
      })
      channelModel.findOneOrThrow.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await expect(
        service.updateChannel('advert-123', 'channel-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.updateChannel('advert-123', 'channel-123', updateDto),
      ).rejects.toThrow(
        'Cannot modify communication channel - advert is in a terminal state',
      )
      expect(channel.update).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is REJECTED', async () => {
      const channel = createMockChannel({
        advert: createMockAdvert({ statusId: StatusIdEnum.REJECTED }),
      })
      channelModel.findOneOrThrow.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await expect(
        service.updateChannel('advert-123', 'channel-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      expect(channel.update).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is WITHDRAWN', async () => {
      const channel = createMockChannel({
        advert: createMockAdvert({ statusId: StatusIdEnum.WITHDRAWN }),
      })
      channelModel.findOneOrThrow.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await expect(
        service.updateChannel('advert-123', 'channel-123', updateDto),
      ).rejects.toThrow(BadRequestException)
      expect(channel.update).not.toHaveBeenCalled()
    })
    it('should include advert in query with statusId attribute', async () => {
      const channel = createMockChannel({
        advert: createMockAdvert({ statusId: StatusIdEnum.SUBMITTED }),
      })
      channelModel.findOneOrThrow.mockResolvedValue(
        channel as unknown as CommunicationChannelModel,
      )
      await service.updateChannel('advert-123', 'channel-123', updateDto)
      expect(channelModel.findOneOrThrow).toHaveBeenCalledWith({
        where: { id: 'channel-123', advertId: 'advert-123' },
        include: [
          expect.objectContaining({
            model: AdvertModel,
            attributes: ['id', 'statusId'],
          }),
        ],
      })
    })
  })
  describe('deleteChannel', () => {
    it('should allow deletion when advert is editable (SUBMITTED)', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.SUBMITTED })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      channelModel.destroy.mockResolvedValue(1)
      await expect(
        service.deleteChannel('advert-123', 'channel-123'),
      ).resolves.not.toThrow()
      expect(channelModel.destroy).toHaveBeenCalledWith({
        where: { id: 'channel-123', advertId: 'advert-123' },
      })
    })
    it('should allow deletion when advert is IN_PROGRESS', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.IN_PROGRESS })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      channelModel.destroy.mockResolvedValue(1)
      await expect(
        service.deleteChannel('advert-123', 'channel-123'),
      ).resolves.not.toThrow()
      expect(channelModel.destroy).toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is PUBLISHED', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.PUBLISHED })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.deleteChannel('advert-123', 'channel-123'),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.deleteChannel('advert-123', 'channel-123'),
      ).rejects.toThrow(
        'Cannot modify communication channel - advert is in a terminal state',
      )
      expect(channelModel.destroy).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is REJECTED', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.REJECTED })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.deleteChannel('advert-123', 'channel-123'),
      ).rejects.toThrow(BadRequestException)
      expect(channelModel.destroy).not.toHaveBeenCalled()
    })
    it('should throw BadRequestException when advert is WITHDRAWN', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.WITHDRAWN })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      await expect(
        service.deleteChannel('advert-123', 'channel-123'),
      ).rejects.toThrow(BadRequestException)
      expect(channelModel.destroy).not.toHaveBeenCalled()
    })
    it('should fetch advert with statusId attribute before deletion', async () => {
      const advert = createMockAdvert({ statusId: StatusIdEnum.SUBMITTED })
      advertModel.findByPkOrThrow.mockResolvedValue(
        advert as unknown as AdvertModel,
      )
      channelModel.destroy.mockResolvedValue(1)
      await service.deleteChannel('advert-123', 'channel-123')
      expect(advertModel.findByPkOrThrow).toHaveBeenCalledWith('advert-123', {
        attributes: ['id', 'statusId'],
      })
    })
  })
})
