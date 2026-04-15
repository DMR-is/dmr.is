import { Test, TestingModule } from '@nestjs/testing'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { HtmlAdminController } from './html-admin.controller'
import { IHtmlAdminService } from './html-admin.service.interface'

const MOCK_USER = {
  adminUserId: 'admin-user-1',
  nationalId: '1234567890',
}

const mockPreviewResult = {
  dryRun: true,
  total: 42,
  backfilled: 42,
  failed: 0,
  items: [],
  message: 'Prufukeyrsla: 42 auglýsingar fundust',
}

const mockStartResult = {
  dryRun: false,
  total: 0,
  backfilled: 0,
  failed: 0,
  items: [],
  message: 'Backfill started',
}

describe('HtmlAdminController', () => {
  let controller: HtmlAdminController
  let service: {
    previewBackfill: jest.Mock
    startBackfill: jest.Mock
    getBackfillStatus: jest.Mock
    getBackfilledPublications: jest.Mock
    startRevert: jest.Mock
    getRevertStatus: jest.Mock
  }

  beforeEach(async () => {
    const mockService = {
      previewBackfill: jest.fn().mockResolvedValue(mockPreviewResult),
      startBackfill: jest.fn().mockReturnValue(mockStartResult),
      getBackfillStatus: jest.fn().mockReturnValue({ status: 'idle' }),
      getBackfilledPublications: jest
        .fn()
        .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 }),
      startRevert: jest
        .fn()
        .mockReturnValue({ started: true, status: { status: 'running' } }),
      getRevertStatus: jest.fn().mockReturnValue({ status: 'idle' }),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HtmlAdminController],
      providers: [
        {
          provide: IHtmlAdminService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(TokenJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthorizationGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<HtmlAdminController>(HtmlAdminController)
    service = mockService
    jest.clearAllMocks()
  })

  describe('backfillPublishedHtml', () => {
    it('should call previewBackfill when dryRun is "true"', async () => {
      const result = await controller.backfillPublishedHtml(
        'true',
        MOCK_USER as any,
      )

      expect(service.previewBackfill).toHaveBeenCalledWith(MOCK_USER)
      expect(service.startBackfill).not.toHaveBeenCalled()
      expect(result).toEqual(mockPreviewResult)
    })

    it('should call startBackfill when dryRun is "false"', async () => {
      const result = await controller.backfillPublishedHtml(
        'false',
        MOCK_USER as any,
      )

      expect(service.startBackfill).toHaveBeenCalledWith(MOCK_USER)
      expect(service.previewBackfill).not.toHaveBeenCalled()
      expect(result).toEqual(mockStartResult)
    })

    it('should call startBackfill when dryRun is undefined', async () => {
      const result = await controller.backfillPublishedHtml(
        undefined as any,
        MOCK_USER as any,
      )

      expect(service.startBackfill).toHaveBeenCalledWith(MOCK_USER)
      expect(service.previewBackfill).not.toHaveBeenCalled()
    })

    it('should NOT call previewBackfill when dryRun is string "false"', async () => {
      await controller.backfillPublishedHtml('false', MOCK_USER as any)

      expect(service.previewBackfill).not.toHaveBeenCalled()
      expect(service.startBackfill).toHaveBeenCalled()
    })
  })

  describe('getBackfillStatus', () => {
    it('should delegate to service', () => {
      controller.getBackfillStatus()
      expect(service.getBackfillStatus).toHaveBeenCalled()
    })
  })

  describe('getBackfilledPublications', () => {
    it('should delegate to service with query', async () => {
      await controller.getBackfilledPublications({ page: 2, pageSize: 10 })
      expect(service.getBackfilledPublications).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
      })
    })
  })

  describe('startBackfillRevert', () => {
    it('should delegate to service', () => {
      controller.startBackfillRevert(MOCK_USER as any)
      expect(service.startRevert).toHaveBeenCalledWith(MOCK_USER)
    })
  })

  describe('getRevertStatus', () => {
    it('should delegate to service', () => {
      controller.getRevertStatus()
      expect(service.getRevertStatus).toHaveBeenCalled()
    })
  })
})
