import {
  BadRequestException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common'

import { ImportUploadBoundary } from '@dmr.is/doe-modules/import-upload'
import { UserModel } from '@dmr.is/doe-modules/user'

import { CompanyImportController } from './company-import.controller'

const KEY = 'doe-imports/admin/11111111-2222-3333-4444-555555555555.xlsx'
const ADMIN = { id: 'admin-1' } as UserModel

const build = (applyImpl: jest.Mock) => {
  const cleanupAfter = jest.fn().mockResolvedValue(undefined)
  const fetchWorkbook = jest.fn().mockResolvedValue(Buffer.from('x'))
  const controller = new CompanyImportController(
    { preview: jest.fn(), apply: applyImpl },
    { fetchWorkbook, cleanupAfter } as never,
  )
  return { controller, cleanupAfter, fetchWorkbook }
}

describe('CompanyImportController', () => {
  /**
   * This controller used to decide for itself which failures may destroy the
   * staged upload, exempting `ServiceUnavailableException` and deleting on
   * everything else. That read as "keep it when the failure was transient" and
   * was not: a transient S3 error arrives as a plain `HttpException`, so it
   * fell through to the delete — and once the download moved inside `apply`,
   * that path became reachable rather than theoretical.
   *
   * The rule now lives in one place. What belongs here is that the outcome is
   * *reported* faithfully, not which outcomes delete — that is pinned in
   * `import-upload.service.spec.ts`, against the real predicate.
   */
  describe('apply — reports the outcome and lets cleanupAfter judge it', () => {
    it('reports success with no error', async () => {
      const { controller, cleanupAfter } = build(
        jest.fn().mockResolvedValue({ committed: true }),
      )

      await controller.apply({ key: KEY }, ADMIN)

      expect(cleanupAfter).toHaveBeenCalledWith(KEY, ImportUploadBoundary.ADMIN)
    })

    it('hands a shed 503 to cleanupAfter rather than deleting', async () => {
      const shed = new ServiceUnavailableException('busy')
      const { controller, cleanupAfter } = build(
        jest.fn().mockRejectedValue(shed),
      )

      await expect(controller.apply({ key: KEY }, ADMIN)).rejects.toBe(shed)

      expect(cleanupAfter).toHaveBeenCalledWith(
        KEY,
        ImportUploadBoundary.ADMIN,
        shed,
      )
    })

    it('hands a terminal failure to cleanupAfter too', async () => {
      const bad = new BadRequestException('unreadable')
      const { controller, cleanupAfter } = build(
        jest.fn().mockRejectedValue(bad),
      )

      await expect(controller.apply({ key: KEY }, ADMIN)).rejects.toBe(bad)

      expect(cleanupAfter).toHaveBeenCalledWith(
        KEY,
        ImportUploadBoundary.ADMIN,
        bad,
      )
    })

    /**
     * The regression that made this rewrite necessary: a transient storage
     * failure is not a 503, so the old local rule deleted the upload. The
     * controller must not filter — it passes the error on whatever it is.
     */
    it('does not swallow a transient storage error before reporting it', async () => {
      const blip = new HttpException('S3 unavailable', HttpStatus.BAD_GATEWAY)
      const { controller, cleanupAfter } = build(
        jest.fn().mockRejectedValue(blip),
      )

      await expect(controller.apply({ key: KEY }, ADMIN)).rejects.toBe(blip)

      expect(cleanupAfter).toHaveBeenCalledWith(
        KEY,
        ImportUploadBoundary.ADMIN,
        blip,
      )
    })
  })

  describe('does not fetch ahead of the gate', () => {
    it('hands the key to the service and never downloads itself', async () => {
      const apply = jest.fn().mockResolvedValue({ committed: true })
      const { controller, fetchWorkbook } = build(apply)

      await controller.apply({ key: KEY }, ADMIN)

      expect(apply).toHaveBeenCalledWith(KEY, ADMIN.id)
      expect(fetchWorkbook).not.toHaveBeenCalled()
    })

    it('previews by key too', async () => {
      const preview = jest.fn().mockResolvedValue({ committed: false })
      const cleanupAfter = jest.fn().mockResolvedValue(undefined)
      const fetchWorkbook = jest.fn()
      const controller = new CompanyImportController(
        { preview, apply: jest.fn() },
        { fetchWorkbook, cleanupAfter } as never,
      )

      await controller.preview({ key: KEY })

      expect(preview).toHaveBeenCalledWith(KEY)
      expect(fetchWorkbook).not.toHaveBeenCalled()
    })
  })
})
