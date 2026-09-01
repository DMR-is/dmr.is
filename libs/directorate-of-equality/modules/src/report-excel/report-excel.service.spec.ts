import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { PARSE_GATE } from '../parse-gate/parse-gate.token'
import { Semaphore } from '../parse-gate/semaphore'
import { ReportExcelService } from './report-excel.service'

jest.mock('./parser/workbook.parser', () => ({
  parseWorkbook: jest.fn(),
}))
import { parseWorkbook } from './parser/workbook.parser'

const mockParse = parseWorkbook as jest.Mock

const KEY = 'doe-imports/admin/11111111-2222-3333-4444-555555555555.xlsx'
const BUF = Buffer.from('workbook')

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

let mockFetchWorkbook: jest.Mock
let mockAssertKey: jest.Mock

/** Flush microtasks and the timer phase so pending awaits settle. */
const tick = () => new Promise((r) => setImmediate(r))

const build = async (gate: Semaphore) => {
  const module = await Test.createTestingModule({
    providers: [
      ReportExcelService,
      { provide: LOGGER_PROVIDER, useValue: mockLogger },
      { provide: PARSE_GATE, useValue: gate },
      {
        provide: IImportUploadService,
        useValue: {
          assertKeyWithinBoundary: mockAssertKey,
          fetchWorkbook: mockFetchWorkbook,
        },
      },
    ],
  }).compile()
  return module.get(ReportExcelService)
}

/**
 * `ReportExcelService` had no spec at all, which is how it came to serve four
 * of the six import paths with none of the gate's invariants pinned: reverting
 * the ordering here — hoisting `fetchWorkbook` back out of the gated region and
 * dropping the pre-gate key check — left the whole suite green.
 *
 * These tests exist to make that revert impossible to land quietly. They assert
 * *when* the download happens, not that it happened.
 */
describe('ReportExcelService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchWorkbook = jest.fn().mockResolvedValue(BUF)
    mockAssertKey = jest.fn()
    mockParse.mockResolvedValue({ rows: [] })
  })

  describe('the workbook is only in memory while a slot is held', () => {
    /**
     * The property the ordering exists for. While the controllers downloaded
     * first, every queued caller held up to `MAX_UPLOAD_BYTES` for the length
     * of its wait — ~400MB at the default queue depth, none of it in the
     * derivation in `import-upload/archive-budget.ts`.
     */
    it('does not download while it is queued for a slot', async () => {
      const gate = new Semaphore(1, 5)
      const service = await build(gate)

      let finishFirstParse: () => void = () => undefined
      mockParse.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirstParse = () => resolve({ rows: [] })
          }),
      )

      const first = service.importWorkbook(KEY, ImportUploadBoundary.ADMIN)
      await tick()
      expect(mockFetchWorkbook).toHaveBeenCalledTimes(1)

      const second = service.importWorkbook(KEY, ImportUploadBoundary.ADMIN)
      await tick()

      expect(gate.queuedCount).toBe(1)
      expect(mockFetchWorkbook).toHaveBeenCalledTimes(1)

      finishFirstParse()
      await first
      await second

      expect(mockFetchWorkbook).toHaveBeenCalledTimes(2)
    })

    it('passes the caller boundary through to the download', async () => {
      const service = await build(new Semaphore(2, 20))

      await service.importWorkbook(KEY, ImportUploadBoundary.APPLICATION)

      expect(mockFetchWorkbook).toHaveBeenCalledWith(
        KEY,
        ImportUploadBoundary.APPLICATION,
      )
    })

    it('releases its slot after a parse', async () => {
      const gate = new Semaphore(1, 0)
      const service = await build(gate)

      await service.importWorkbook(KEY, ImportUploadBoundary.ADMIN)

      expect(gate.activeCount).toBe(0)
    })

    it('releases its slot when the parse throws', async () => {
      const gate = new Semaphore(1, 0)
      const service = await build(gate)
      mockParse.mockRejectedValueOnce(new Error('unreadable workbook'))

      await expect(
        service.importWorkbook(KEY, ImportUploadBoundary.ADMIN),
      ).rejects.toThrow('unreadable workbook')
      expect(gate.activeCount).toBe(0)
    })

    /** A failed download must not strand the slot either. */
    it('releases its slot when the download throws', async () => {
      const gate = new Semaphore(1, 0)
      const service = await build(gate)
      mockFetchWorkbook.mockRejectedValueOnce(new Error('S3 unavailable'))

      await expect(
        service.importWorkbook(KEY, ImportUploadBoundary.ADMIN),
      ).rejects.toThrow('S3 unavailable')
      expect(gate.activeCount).toBe(0)
    })
  })

  describe('key validation happens before the gate', () => {
    /**
     * The gate must be *saturated* for this to prove anything. On an idle gate,
     * validating after acquiring looks identical from outside — the acquire
     * succeeds, the throw happens, the `finally` releases, every count returns
     * to zero. Holding the only slot with no queue is what separates the two
     * orderings: validation first yields a 400, validation second sheds a 503
     * without ever looking at the key.
     */
    it('rejects an invalid key rather than queueing it', async () => {
      const gate = new Semaphore(1, 0)
      const held = await gate.acquire()
      const service = await build(gate)
      mockAssertKey.mockImplementationOnce(() => {
        throw new BadRequestException('Invalid import upload key')
      })

      await expect(
        service.importWorkbook('nonsense', ImportUploadBoundary.ADMIN),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(mockFetchWorkbook).not.toHaveBeenCalled()
      expect(mockParse).not.toHaveBeenCalled()

      held()
    })
  })

  describe('shed load', () => {
    it('answers 503 without downloading when the gate is saturated', async () => {
      const gate = new Semaphore(1, 0)
      const held = await gate.acquire()
      const service = await build(gate)

      await expect(
        service.importWorkbook(KEY, ImportUploadBoundary.ADMIN),
      ).rejects.toBeInstanceOf(ServiceUnavailableException)

      // The point of gating ahead of the download: the expensive call never
      // happens, so a shed request costs nothing.
      expect(mockFetchWorkbook).not.toHaveBeenCalled()

      held()
    })
  })
})
