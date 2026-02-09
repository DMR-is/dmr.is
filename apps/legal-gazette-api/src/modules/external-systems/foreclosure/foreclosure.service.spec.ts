/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getModelToken } from '@nestjs/sequelize'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ForeclosureModel } from '../../../models/foreclosure.model'
import { ForeclosurePropertyModel } from '../../../models/foreclosure-property.model'
import { StatusIdEnum } from '../../../models/status.model'
import { IAdvertService } from '../../advert/advert.service.interface'
import { ForeclosureService } from './foreclosure.service'

describe('ForeclosureService - HTML Escaping', () => {
  let service: ForeclosureService
  let advertService: jest.Mocked<IAdvertService>
  let foreclosureModel: typeof ForeclosureModel
  let foreclosurePropertyModel: typeof ForeclosurePropertyModel

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }

  const mockAdvertService = {
    createAdvert: jest.fn(),
    markAdvertAsWithdrawn: jest.fn(),
  }

  const mockForeclosureModel = {
    create: jest.fn(),
    findByPkOrThrow: jest.fn(),
  }

  const mockForeclosurePropertyModel = {
    create: jest.fn(),
    destroy: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForeclosureService,
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: IAdvertService,
          useValue: mockAdvertService,
        },
        {
          provide: getModelToken(ForeclosureModel),
          useValue: mockForeclosureModel,
        },
        {
          provide: getModelToken(ForeclosurePropertyModel),
          useValue: mockForeclosurePropertyModel,
        },
      ],
    }).compile()

    service = module.get<ForeclosureService>(ForeclosureService)
    advertService = module.get(IAdvertService)
    foreclosureModel = module.get(getModelToken(ForeclosureModel))
    foreclosurePropertyModel = module.get(getModelToken(ForeclosurePropertyModel))

    // Reset mocks
    jest.clearAllMocks()
  })

  describe('createForeclosureSale - HTML Escaping', () => {
    const mockAdvertId = 'advert-123'
    const mockForeclosureId = 'foreclosure-456'

    beforeEach(() => {
      advertService.createAdvert.mockResolvedValue({ id: mockAdvertId } as any)
      mockForeclosureModel.create.mockResolvedValue({
        id: mockForeclosureId,
        advertId: mockAdvertId,
        reload: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({
          id: mockForeclosureId,
          advertId: mockAdvertId,
          properties: [],
        }),
      } as any)
    })

    it('should escape HTML in foreclosureRegion field', async () => {
      // Arrange
      const maliciousRegion = '<script>alert("XSS")</script>'
      const input = {
        foreclosureRegion: maliciousRegion,
        foreclosureAddress: 'Test Address',
        foreclosureDate: '2026-01-15T00:00:00Z',
        caseNumberIdentifier: 'CASE-001',
        responsibleParty: {
          name: 'Test Person',
          nationalId: '1234567890',
          signature: {
            name: 'Test Signer',
            date: new Date('2026-01-15T00:00:00Z'),
            location: 'Reykjavik',
            onBehalfOf: undefined,
          },
        },
        properties: [],
      }

      // Act
      await service.createForeclosureSale(input as any)

      // Assert - title should have escaped HTML
      expect(advertService.createAdvert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('&lt;script&gt;'),
        }),
      )
      expect(advertService.createAdvert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.not.stringContaining('<script>'),
        }),
      )
    })

    it('should escape HTML in foreclosureAddress field', async () => {
      // Arrange
      const maliciousAddress = 'Main St <img src=x onerror=alert("XSS")>'
      const input = {
        foreclosureRegion: 'Reykjavik',
        foreclosureAddress: maliciousAddress,
        foreclosureDate: '2026-01-15T00:00:00Z',
        caseNumberIdentifier: 'CASE-001',
        responsibleParty: {
          name: 'Test Person',
          nationalId: '1234567890',
          signature: {
            name: 'Test Signer',
            date: new Date('2026-01-15T00:00:00Z'),
            location: 'Reykjavik',
            onBehalfOf: undefined,
          },
        },
        properties: [],
      }

      // Act
      await service.createForeclosureSale(input as any)

      // Assert - foreclosureAddress should be escaped when stored
      expect(mockForeclosureModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          foreclosureAddress: expect.stringContaining('&lt;img'),
        }),
        expect.any(Object),
      )
    })

    it('should escape HTML in responsibleParty.name field', async () => {
      // Arrange
      const maliciousName = 'Evil Corp <script>document.cookie</script>'
      const input = {
        foreclosureRegion: 'Reykjavik',
        foreclosureAddress: 'Test Address',
        foreclosureDate: '2026-01-15T00:00:00Z',
        caseNumberIdentifier: 'CASE-001',
        responsibleParty: {
          name: maliciousName,
          nationalId: '1234567890',
          signature: {
            name: 'Test Signer',
            date: new Date('2026-01-15T00:00:00Z'),
            location: 'Reykjavik',
            onBehalfOf: undefined,
          },
        },
        properties: [],
      }

      // Act
      await service.createForeclosureSale(input as any)

      // Assert - createdBy should have escaped HTML
      expect(advertService.createAdvert).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: expect.stringContaining('&lt;script&gt;'),
        }),
      )
    })

    it('should escape HTML in signature.name field', async () => {
      // Arrange
      const maliciousSignatureName = 'John Doe <b>CEO</b>'
      const input = {
        foreclosureRegion: 'Reykjavik',
        foreclosureAddress: 'Test Address',
        foreclosureDate: '2026-01-15T00:00:00Z',
        caseNumberIdentifier: 'CASE-001',
        responsibleParty: {
          name: 'Test Person',
          nationalId: '1234567890',
          signature: {
            name: maliciousSignatureName,
            date: new Date('2026-01-15T00:00:00Z'),
            location: 'Reykjavik',
            onBehalfOf: undefined,
          },
        },
        properties: [],
      }

      // Act
      await service.createForeclosureSale(input as any)

      // Assert - signature.name should have escaped HTML
      expect(advertService.createAdvert).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({
            name: expect.stringContaining('&lt;b&gt;'),
          }),
        }),
      )
    })

    it('should escape HTML in signature.onBehalfOf field', async () => {
      // Arrange
      const maliciousOnBehalfOf = 'Company & Sons <i>Ltd.</i>'
      const input = {
        foreclosureRegion: 'Reykjavik',
        foreclosureAddress: 'Test Address',
        foreclosureDate: '2026-01-15T00:00:00Z',
        caseNumberIdentifier: 'CASE-001',
        responsibleParty: {
          name: 'Test Person',
          nationalId: '1234567890',
          signature: {
            name: 'Test Signer',
            date: new Date('2026-01-15T00:00:00Z'),
            location: 'Reykjavik',
            onBehalfOf: maliciousOnBehalfOf,
          },
        },
        properties: [],
      }

      // Act
      await service.createForeclosureSale(input as any)

      // Assert - signature.onBehalfOf should have escaped HTML and ampersand
      expect(advertService.createAdvert).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({
            onBehalfOf: expect.stringContaining('&amp;'),
          }),
        }),
      )
      expect(advertService.createAdvert).toHaveBeenCalledWith(
        expect.objectContaining({
          signature: expect.objectContaining({
            onBehalfOf: expect.stringContaining('&lt;i&gt;'),
          }),
        }),
      )
    })

    it('should escape HTML in property fields (propertyName, claimant, respondent)', async () => {
      // Arrange
      const input = {
        foreclosureRegion: 'Reykjavik',
        foreclosureAddress: 'Test Address',
        foreclosureDate: '2026-01-15T00:00:00Z',
        caseNumberIdentifier: 'CASE-001',
        responsibleParty: {
          name: 'Test Person',
          nationalId: '1234567890',
          signature: {
            name: 'Test Signer',
            date: new Date('2026-01-15T00:00:00Z'),
            location: 'Reykjavik',
            onBehalfOf: undefined,
          },
        },
        properties: [
          {
            propertyName: 'Property <script>alert("XSS")</script>',
            propertyNumber: '001',
            propertyTotalPrice: 1000000,
            claimant: 'Claimant & Co. <b>LLC</b>',
            respondent: 'Respondent <img src=x onerror=alert(1)>',
          },
        ],
      }

      // Act
      await service.createForeclosureSale(input as any)

      // Assert - property fields should have escaped HTML
      expect(mockForeclosureModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.arrayContaining([
            expect.objectContaining({
              propertyName: expect.stringContaining('&lt;script&gt;'),
              claimant: expect.stringContaining('&amp;'),
              respondent: expect.stringContaining('&lt;img'),
            }),
          ]),
        }),
        expect.any(Object),
      )
    })

    it('should preserve legitimate text content while escaping HTML', async () => {
      // Arrange - legitimate data that contains special characters
      const input = {
        foreclosureRegion: 'Reykjavík & Hafnarfjörður',
        foreclosureAddress: 'Laugavegur 1 "Main Street"',
        foreclosureDate: '2026-01-15T00:00:00Z',
        caseNumberIdentifier: 'CASE-001',
        responsibleParty: {
          name: "O'Brien & Associates",
          nationalId: '1234567890',
          signature: {
            name: 'John "Jack" Doe',
            date: new Date('2026-01-15T00:00:00Z'),
            location: 'Reykjavik',
            onBehalfOf: undefined,
          },
        },
        properties: [],
      }

      // Act
      await service.createForeclosureSale(input as any)

      // Assert - special characters should be escaped but text preserved
      expect(advertService.createAdvert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('&amp;'), // & escaped to &amp;
          createdBy: expect.stringContaining('&amp;'), // & in O'Brien & Associates
          signature: expect.objectContaining({
            name: expect.stringContaining('&quot;'), // quotes escaped
          }),
        }),
      )
    })
  })

  describe('createForeclosureProperty - HTML Escaping', () => {
    const mockPropertyId = 'property-789'
    const mockForeclosureId = 'foreclosure-456'

    beforeEach(() => {
      // Mock foreclosure with editable advert status
      mockForeclosureModel.findByPkOrThrow = jest.fn().mockResolvedValue({
        id: mockForeclosureId,
        advert: {
          id: 'advert-123',
          statusId: StatusIdEnum.SUBMITTED,
        },
      } as any)

      mockForeclosurePropertyModel.create = jest.fn().mockResolvedValue({
        id: mockPropertyId,
        reload: jest.fn().mockResolvedValue(undefined),
        fromModel: jest.fn().mockReturnValue({
          id: mockPropertyId,
        }),
      } as any)
    })

    it('should escape HTML in all property fields when creating a new property', async () => {
      // Arrange
      const input = {
        propertyName: 'Luxury Apartment <script>alert("XSS")</script>',
        propertyNumber: '002',
        propertyTotalPrice: 5000000,
        claimant: 'Bank & Trust <b>Corporation</b>',
        respondent: 'Debtor <img src=x onerror=alert("XSS")>',
      }

      // Act
      await service.createForeclosureProperty(mockForeclosureId, input)

      // Assert
      expect(mockForeclosurePropertyModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyName: expect.stringContaining('&lt;script&gt;'),
          claimant: expect.stringMatching(/&amp;.*&lt;b&gt;/),
          respondent: expect.stringContaining('&lt;img'),
        }),
        expect.any(Object),
      )
    })
  })
})

describe('ForeclosureService - Status Protection', () => {
  let service: ForeclosureService
  let foreclosureModel: jest.Mocked<typeof ForeclosureModel>
  let foreclosurePropertyModel: jest.Mocked<typeof ForeclosurePropertyModel>

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }

  const mockAdvertService = {
    createAdvert: jest.fn(),
    markAdvertAsWithdrawn: jest.fn(),
  }

  beforeEach(async () => {
    const mockForeclosureModel = {
      findByPkOrThrow: jest.fn(),
    }

    const mockForeclosurePropertyModel = {
      create: jest.fn(),
      findOneOrThrow: jest.fn(),
      destroy: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForeclosureService,
        {
          provide: LOGGER_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: IAdvertService,
          useValue: mockAdvertService,
        },
        {
          provide: getModelToken(ForeclosureModel),
          useValue: mockForeclosureModel,
        },
        {
          provide: getModelToken(ForeclosurePropertyModel),
          useValue: mockForeclosurePropertyModel,
        },
      ],
    }).compile()

    service = module.get<ForeclosureService>(ForeclosureService)
    foreclosureModel = module.get(getModelToken(ForeclosureModel))
    foreclosurePropertyModel = module.get(
      getModelToken(ForeclosurePropertyModel),
    )
  })

  describe('createForeclosureProperty', () => {
    const createDto = {
      propertyName: 'Test Property',
      propertyNumber: '123',
      propertyTotalPrice: 1000000,
      claimant: 'Test Claimant',
      respondent: 'Test Respondent',
    }

    const createMockForeclosure = (statusId: string) => ({
      id: 'foreclosure-123',
      advertId: 'advert-123',
      advert: { id: 'advert-123', statusId },
    })

    const createMockProperty = () => ({
      id: 'property-123',
      foreclosureId: 'foreclosure-123',
      propertyName: 'Test Property',
      reload: jest.fn(),
      fromModel: jest.fn().mockReturnValue({
        id: 'property-123',
        propertyName: 'Test Property',
      }),
    })

    it('should allow property creation when advert is SUBMITTED', async () => {
      const foreclosure = createMockForeclosure(
        'cd3bf301-52a1-493e-8c80-a391c310c840',
      )
      const property = createMockProperty()

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )
      foreclosurePropertyModel.create.mockResolvedValue(property as any)

      await expect(
        service.createForeclosureProperty('foreclosure-123', createDto),
      ).resolves.not.toThrow()

      expect(foreclosurePropertyModel.create).toHaveBeenCalled()
    })

    it('should allow property creation when advert is IN_PROGRESS', async () => {
      const foreclosure = createMockForeclosure(
        '7ef679c4-4f66-4892-b6ad-ee05e0be4359',
      )
      const property = createMockProperty()

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )
      foreclosurePropertyModel.create.mockResolvedValue(property as any)

      await expect(
        service.createForeclosureProperty('foreclosure-123', createDto),
      ).resolves.not.toThrow()
    })

    it('should throw BadRequestException when advert is PUBLISHED', async () => {
      const foreclosure = createMockForeclosure(
        'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
      )

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )

      await expect(
        service.createForeclosureProperty('foreclosure-123', createDto),
      ).rejects.toThrow('Cannot modify foreclosure property')

      expect(foreclosurePropertyModel.create).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when advert is REJECTED', async () => {
      const foreclosure = createMockForeclosure(
        'f3a0b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
      )

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )

      await expect(
        service.createForeclosureProperty('foreclosure-123', createDto),
      ).rejects.toThrow('Cannot modify foreclosure property')

      expect(foreclosurePropertyModel.create).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when advert is WITHDRAWN', async () => {
      const foreclosure = createMockForeclosure(
        'e2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
      )

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )

      await expect(
        service.createForeclosureProperty('foreclosure-123', createDto),
      ).rejects.toThrow('Cannot modify foreclosure property')

      expect(foreclosurePropertyModel.create).not.toHaveBeenCalled()
    })

    it('should fetch foreclosure with advert and statusId before creation', async () => {
      const foreclosure = createMockForeclosure(
        'cd3bf301-52a1-493e-8c80-a391c310c840',
      )
      const property = createMockProperty()

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )
      foreclosurePropertyModel.create.mockResolvedValue(property as any)

      await service.createForeclosureProperty('foreclosure-123', createDto)

      expect(foreclosureModel.findByPkOrThrow).toHaveBeenCalledWith(
        'foreclosure-123',
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              attributes: ['id', 'statusId'],
            }),
          ]),
        }),
      )
    })
  })

  describe('deletePropertyFromForeclosure', () => {
    const createMockForeclosure = (statusId: string) => ({
      id: 'foreclosure-123',
      advertId: 'advert-123',
      advert: { id: 'advert-123', statusId },
    })

    const createMockProperty = () => ({
      id: 'property-123',
      foreclosureId: 'foreclosure-123',
      propertyNumber: '123',
      destroy: jest.fn(),
    })

    it('should allow property deletion when advert is SUBMITTED', async () => {
      const foreclosure = createMockForeclosure(
        'cd3bf301-52a1-493e-8c80-a391c310c840',
      )
      const property = createMockProperty()

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )
      foreclosurePropertyModel.findOneOrThrow.mockResolvedValue(
        property as any,
      )

      await expect(
        service.deletePropertyFromForeclosure('foreclosure-123', '123'),
      ).resolves.not.toThrow()

      expect(property.destroy).toHaveBeenCalledWith({ force: true })
    })

    it('should allow property deletion when advert is IN_PROGRESS', async () => {
      const foreclosure = createMockForeclosure(
        '7ef679c4-4f66-4892-b6ad-ee05e0be4359',
      )
      const property = createMockProperty()

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )
      foreclosurePropertyModel.findOneOrThrow.mockResolvedValue(
        property as any,
      )

      await expect(
        service.deletePropertyFromForeclosure('foreclosure-123', '123'),
      ).resolves.not.toThrow()

      expect(property.destroy).toHaveBeenCalled()
    })

    it('should throw BadRequestException when advert is PUBLISHED', async () => {
      const foreclosure = createMockForeclosure(
        'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
      )

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )

      await expect(
        service.deletePropertyFromForeclosure('foreclosure-123', '123'),
      ).rejects.toThrow('Cannot modify foreclosure property')

      expect(foreclosurePropertyModel.findOneOrThrow).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when advert is REJECTED', async () => {
      const foreclosure = createMockForeclosure(
        'f3a0b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
      )

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )

      await expect(
        service.deletePropertyFromForeclosure('foreclosure-123', '123'),
      ).rejects.toThrow('Cannot modify foreclosure property')

      expect(foreclosurePropertyModel.findOneOrThrow).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when advert is WITHDRAWN', async () => {
      const foreclosure = createMockForeclosure(
        'e2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
      )

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )

      await expect(
        service.deletePropertyFromForeclosure('foreclosure-123', '123'),
      ).rejects.toThrow('Cannot modify foreclosure property')

      expect(foreclosurePropertyModel.findOneOrThrow).not.toHaveBeenCalled()
    })

    it('should fetch foreclosure with advert and statusId before deletion', async () => {
      const foreclosure = createMockForeclosure(
        'cd3bf301-52a1-493e-8c80-a391c310c840',
      )
      const property = createMockProperty()

      foreclosureModel.findByPkOrThrow.mockResolvedValue(
        foreclosure as any,
      )
      foreclosurePropertyModel.findOneOrThrow.mockResolvedValue(
        property as any,
      )

      await service.deletePropertyFromForeclosure('foreclosure-123', '123')

      expect(foreclosureModel.findByPkOrThrow).toHaveBeenCalledWith(
        'foreclosure-123',
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              attributes: ['id', 'statusId'],
            }),
          ]),
        }),
      )
    })
  })
})
