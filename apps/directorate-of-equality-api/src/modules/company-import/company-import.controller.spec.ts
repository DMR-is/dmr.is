import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common'

import { UserModel } from '@dmr.is/doe-modules/user'

import { CompanyImportController } from './company-import.controller'

const KEY = 'imports/admin/abc.xlsx'
const ADMIN = { id: 'admin-1' } as UserModel

const build = (applyImpl: jest.Mock) => {
  const cleanup = jest.fn().mockResolvedValue(undefined)
  const fetchWorkbook = jest.fn().mockResolvedValue(Buffer.from('x'))
  const controller = new CompanyImportController(
    { preview: jest.fn(), apply: applyImpl },
    { fetchWorkbook, cleanup } as never,
  )
  return { controller, cleanup, fetchWorkbook }
}

describe('CompanyImportController', () => {
  describe('apply — when the staged upload may be deleted', () => {
    it('deletes the staged object once the import commits', async () => {
      const { controller, cleanup } = build(
        jest.fn().mockResolvedValue({ committed: true }),
      )

      await controller.apply({ key: KEY }, ADMIN)

      expect(cleanup).toHaveBeenCalledWith(KEY)
    })

    /**
     * The reason this controller does not use a `finally`.
     *
     * A saturated parse gate answers 503 and tells the caller to retry — and
     * the staged object is the thing they would retry with. Deleting it turns
     * a retryable shed into "redo the presign, the PUT and the preview", and
     * the retry fails inside `fetchWorkbook` as an opaque storage error rather
     * than as anything the message prepared them for.
     *
     * `import-upload.service.ts` states the same rule for its own error path:
     * only a terminal outcome may destroy the caller's upload.
     */
    it('keeps the staged object when the import is shed with a 503', async () => {
      const { controller, cleanup } = build(
        jest.fn().mockRejectedValue(new ServiceUnavailableException('busy')),
      )

      await expect(controller.apply({ key: KEY }, ADMIN)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      )

      expect(cleanup).not.toHaveBeenCalled()
    })

    it('still deletes the staged object on a terminal failure', async () => {
      const { controller, cleanup } = build(
        jest.fn().mockRejectedValue(new BadRequestException('unreadable')),
      )

      await expect(controller.apply({ key: KEY }, ADMIN)).rejects.toBeInstanceOf(
        BadRequestException,
      )

      // A workbook that cannot be read is not worth keeping — the distinction
      // being drawn is retryable versus terminal, not error versus success.
      expect(cleanup).toHaveBeenCalledWith(KEY)
    })
  })
})
