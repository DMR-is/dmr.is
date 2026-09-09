import { BadRequestException } from '@nestjs/common'

import { ResultWrapper } from '@dmr.is/types'

import { CompanyMailRecipient } from '../company/company.service.interface'
import { CompanyStatusEnum } from '../company/models/company.enums'
import { CompanyEventTypeEnum } from '../company/models/company-event.model'
import { ImportUploadBoundary } from '../import-upload/import-upload.service.interface'
import {
  CompanyEmailRecipientStatusEnum,
  CompanyEmailStatusEnum,
} from './models/company-email.enums'
import { CompanyEmailService } from './company-email.service'

const ONE_MB = 1024 * 1024

describe('CompanyEmailService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const companyService = {
    findMailRecipientsByIds: jest.fn(),
    findMailRecipientsByFilter: jest.fn(),
  }

  const companyEventService = { emitCustomEmailOutcome: jest.fn() }
  const mailService = { sendCustomEmail: jest.fn() }
  const uploadService = {
    createUpload: jest.fn(),
    fetchObject: jest.fn(),
    cleanupAfter: jest.fn(),
  }
  const aws = { uploadObject: jest.fn() }

  const companyEmailModel = {
    create: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findOneOrThrow: jest.fn(),
  }
  const recipientModel = { bulkCreate: jest.fn(), findAll: jest.fn() }
  const attachmentModel = { bulkCreate: jest.fn(), findAll: jest.fn() }

  let service: CompanyEmailService

  const makeCompany = (
    overrides: Partial<CompanyMailRecipient> = {},
  ): CompanyMailRecipient => ({
    id: 'company-1',
    name: 'Fyrirtæki ehf.',
    email: 'skra@fyrirtaeki.is',
    quarantined: false,
    ...overrides,
  })

  const validDto = {
    subject: 'Áminning',
    bodyHtml: '<p>Halló</p>',
    companyIds: ['company-1'],
  }

  beforeEach(() => {
    jest.clearAllMocks()

    companyEmailModel.create.mockResolvedValue({ id: 'batch-1' })
    companyEmailModel.update.mockResolvedValue([1])
    // A fresh batch: QUEUED, so the delivery loop treats it as a first run.
    companyEmailModel.findOne.mockResolvedValue({
      status: CompanyEmailStatusEnum.QUEUED,
    })
    recipientModel.bulkCreate.mockResolvedValue([])
    recipientModel.findAll.mockResolvedValue([])
    attachmentModel.bulkCreate.mockResolvedValue([])
    attachmentModel.findAll.mockResolvedValue([])
    mailService.sendCustomEmail.mockResolvedValue({ ok: true })
    companyService.findMailRecipientsByIds.mockResolvedValue([makeCompany()])

    service = new CompanyEmailService(
      logger as never,
      companyService as never,
      companyEventService as never,
      mailService as never,
      uploadService as never,
      aws as never,
      companyEmailModel as never,
      recipientModel as never,
      attachmentModel as never,
    )
  })

  describe('recipient classification', () => {
    it('lists a deliverable company as a recipient', async () => {
      const preview = await service.preview(validDto)

      expect(preview.recipientCount).toBe(1)
      expect(preview.skippedCount).toBe(0)
      expect(preview.recipients[0]).toEqual({
        companyId: 'company-1',
        companyName: 'Fyrirtæki ehf.',
        email: 'skra@fyrirtaeki.is',
      })
    })

    it('skips a quarantined company and says why', async () => {
      // ⚠️ `quarantined` means all outbound activity is halted. It must not be
      // silently dropped either: a recipient list that shrinks with no
      // explanation is one an admin cannot check against the count they saw.
      companyService.findMailRecipientsByIds.mockResolvedValue([
        makeCompany({ quarantined: true }),
      ])

      const preview = await service.preview(validDto)

      expect(preview.recipientCount).toBe(0)
      expect(preview.skipped[0].reason).toBe(
        CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED,
      )
    })

    it('reports a quarantined company with no email as quarantined', async () => {
      // Order matters: quarantine is the fact an admin needs, and calling it
      // "no address" would send them off to fill one in for a halted company.
      companyService.findMailRecipientsByIds.mockResolvedValue([
        makeCompany({ quarantined: true, email: null }),
      ])

      const preview = await service.preview(validDto)

      expect(preview.skipped[0].reason).toBe(
        CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED,
      )
    })

    it.each([
      ['null', null],
      ['empty', ''],
      ['not an address', 'ekki-netfang'],
      // The one that matters most: nodemailer splits `to` on commas, so this
      // would have delivered one company's message to a second company.
      ['a comma-separated list', 'a@x.is, b@y.is'],
    ])('skips a company whose email is %s', async (_label, email) => {
      companyService.findMailRecipientsByIds.mockResolvedValue([
        makeCompany({ email }),
      ])

      const preview = await service.preview(validDto)

      expect(preview.recipientCount).toBe(0)
      expect(preview.skipped[0].reason).toBe(
        CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL,
      )
      // Nulled rather than echoed back: the address is unusable, and showing it
      // in the preview would suggest it is what the mail would have gone to.
      expect(preview.skipped[0].email).toBeNull()
    })

    it('applies the address override for a single company', async () => {
      const preview = await service.preview({
        ...validDto,
        recipientEmail: 'annad@fyrirtaeki.is',
      })

      expect(preview.recipients[0].email).toBe('annad@fyrirtaeki.is')
    })

    it('ignores the address override when more than one company is addressed', async () => {
      // ⚠️ There is no single address a bulk send could mean, and quietly
      // applying one admin-typed address to every company is not recoverable.
      companyService.findMailRecipientsByIds.mockResolvedValue([
        makeCompany({ id: 'a', email: 'a@x.is' }),
        makeCompany({ id: 'b', email: 'b@x.is' }),
      ])

      const preview = await service.preview({
        ...validDto,
        companyIds: ['a', 'b'],
        recipientEmail: 'override@x.is',
      })

      expect(preview.recipients.map((r) => r.email)).toEqual([
        'a@x.is',
        'b@x.is',
      ])
    })
  })

  describe('recipient selection', () => {
    it('rejects a request naming neither companies nor a filter', async () => {
      await expect(
        service.preview({ subject: 'a', bodyHtml: '<p>b</p>' }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('rejects a request naming both', async () => {
      await expect(
        service.preview({
          subject: 'a',
          bodyHtml: '<p>b</p>',
          companyIds: ['company-1'],
          filter: {} as never,
        }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('resolves a filter through the company list query', async () => {
      companyService.findMailRecipientsByFilter.mockResolvedValue([
        makeCompany(),
      ])

      await service.preview({
        subject: 'a',
        bodyHtml: '<p>b</p>',
        filter: { quarantined: false } as never,
      })

      // The list's own resolution, not a second copy of the filter logic — this
      // is what keeps the count an admin approves and the set that is written to
      // in agreement.
      expect(companyService.findMailRecipientsByFilter).toHaveBeenCalledWith({
        quarantined: false,
      })
    })
  })

  describe('send', () => {
    it('sanitises the body once, before storing it', async () => {
      await service.send(
        { ...validDto, bodyHtml: '<p onclick="steal()">Halló</p><script>x()</script>' },
        'user-1',
      )

      const [created] = companyEmailModel.create.mock.calls[0]
      // Stored sanitised, so the preview, the delivered mail and the timeline
      // read-back are the same bytes rather than three passes that could differ.
      expect(created.bodyHtml).toBe('<p>Halló</p>')
    })

    it('writes a recipient row per company, carrying the skip status', async () => {
      companyService.findMailRecipientsByIds.mockResolvedValue([
        makeCompany({ id: 'a' }),
        makeCompany({ id: 'b', quarantined: true }),
      ])

      const result = await service.send(
        { ...validDto, companyIds: ['a', 'b'] },
        'user-1',
      )

      const [rows] = recipientModel.bulkCreate.mock.calls[0]
      expect(rows).toHaveLength(2)
      expect(rows[1].status).toBe(
        CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED,
      )
      // The counts the UI shows: queued vs excluded, and they sum to the match.
      expect(result).toEqual({
        id: 'batch-1',
        recipientCount: 1,
        skippedCount: 1,
      })
    })

    it('refuses a send that resolves to no companies at all', async () => {
      companyService.findMailRecipientsByIds.mockResolvedValue([])

      await expect(service.send(validDto, 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('records the filter for audit but not for a company-id send', async () => {
      await service.send(validDto, 'user-1')

      const [created] = companyEmailModel.create.mock.calls[0]
      expect(created.filter).toBeNull()
      expect(created.status).toBe(CompanyEmailStatusEnum.QUEUED)
    })
  })

  describe('attachments', () => {
    const attachment = { key: 'doe-imports/mail-attachment/x.pdf', filename: 'bref.pdf' }

    it('fetches through the mail-attachment boundary', async () => {
      uploadService.fetchObject.mockResolvedValue(Buffer.alloc(10))

      await service.send({ ...validDto, attachments: [attachment] }, 'user-1')

      // The boundary is what stops a client-supplied key being pointed at an
      // import workbook or an arbitrary object.
      expect(uploadService.fetchObject).toHaveBeenCalledWith(
        attachment.key,
        ImportUploadBoundary.MAIL_ATTACHMENT,
        expect.any(Number),
      )
    })

    it('rejects attachments whose combined size exceeds the cap', async () => {
      // ⚠️ The running total, not the per-file size: five files each just under
      // the per-file cap would otherwise clear it together and be rejected by
      // SES instead — after the admin had been told the send was accepted.
      uploadService.fetchObject.mockResolvedValue(Buffer.alloc(ONE_MB * 3))

      await expect(
        service.send(
          {
            ...validDto,
            attachments: [attachment, { ...attachment, filename: 'b.pdf' }],
          },
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(companyEmailModel.create).not.toHaveBeenCalled()
    })

    it('turns an unreadable staged object into a 400, not a queued batch', async () => {
      uploadService.fetchObject.mockRejectedValue(new Error('gone'))

      await expect(
        service.send({ ...validDto, attachments: [attachment] }, 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(companyEmailModel.create).not.toHaveBeenCalled()
    })
  })

  describe('delivery', () => {
    /** A recipient row with a spy-able `update`, as the loop sees it. */
    const makeRow = (overrides: Record<string, unknown> = {}) => {
      const row = {
        companyId: 'company-1',
        companyName: 'Fyrirtæki ehf.',
        email: 'skra@fyrirtaeki.is',
        status: CompanyEmailRecipientStatusEnum.PENDING,
        // Joined in `deliver`, and the value the timeline event is recorded
        // under — see the INACTIVE case below.
        company: { id: 'company-1', status: CompanyStatusEnum.ACTIVE },
        update: jest.fn(),
        ...overrides,
      }
      row.update.mockImplementation(async (values: Record<string, unknown>) => {
        Object.assign(row, values)
        return row
      })
      return row
    }

    it('marks a delivered recipient SENT and records it on the timeline', async () => {
      const row = makeRow()
      recipientModel.findAll.mockResolvedValue([row])

      // No ambient CLS transaction in a unit test, so `runAfterCommit` runs the
      // work inline — which is exactly the fallback it documents.
      await service.send(validDto, 'user-1')

      expect(mailService.sendCustomEmail).toHaveBeenCalledWith(
        'skra@fyrirtaeki.is',
        'Áminning',
        '<p>Halló</p>',
        [],
      )
      expect(row.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CompanyEmailRecipientStatusEnum.SENT,
          error: null,
        }),
      )
      expect(companyEventService.emitCustomEmailOutcome).toHaveBeenCalledWith(
        'company-1',
        expect.anything(),
        CompanyEventTypeEnum.CUSTOM_EMAIL_SENT,
        'batch-1',
        'Áminning',
        // The reviewer who sent it, so the timeline can name them.
        'user-1',
        null,
      )
    })

    it("records the event under the company's own register status", async () => {
      // Nothing constrains a send to ACTIVE companies — a filter with no
      // `status` matches INACTIVE ones too, and `findMailRecipientsByIds` does
      // not filter at all. `company_event.status` is NOT NULL on an immutable
      // table, so a constant here would be a false audit row.
      recipientModel.findAll.mockResolvedValue([
        makeRow({
          company: { id: 'company-1', status: CompanyStatusEnum.INACTIVE },
        }),
      ])

      await service.send(validDto, 'user-1')

      expect(companyEventService.emitCustomEmailOutcome).toHaveBeenCalledWith(
        'company-1',
        CompanyStatusEnum.INACTIVE,
        CompanyEventTypeEnum.CUSTOM_EMAIL_SENT,
        'batch-1',
        'Áminning',
        'user-1',
        null,
      )
    })

    it('records a failed send without stopping the batch', async () => {
      // ⚠️ The core resilience property: one bad address must not cost the other
      // 1 699 companies their message.
      const rows = [makeRow({ companyId: 'a' }), makeRow({ companyId: 'b' })]
      recipientModel.findAll.mockResolvedValue(rows)
      mailService.sendCustomEmail
        .mockResolvedValueOnce({ ok: false, error: 'SES rejected' })
        .mockResolvedValueOnce({ ok: true })

      await service.send(validDto, 'user-1')

      expect(rows[0].update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CompanyEmailRecipientStatusEnum.FAILED,
          error: 'SES rejected',
        }),
      )
      expect(rows[1].update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CompanyEmailRecipientStatusEnum.SENT,
        }),
      )
      expect(companyEmailModel.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: CompanyEmailStatusEnum.COMPLETED }),
        expect.anything(),
      )
    })

    it('records a skipped company on its timeline without attempting a send', async () => {
      /*
       * ⚠️ The skip is the outcome an admin most needs to see — "we deliberately
       * did not write to this company" — and nothing else writes it: the resolve
       * step only sets the row's status. An early return here left
       * CUSTOM_EMAIL_SKIPPED unreachable and the company's timeline silent.
       */
      const row = makeRow({
        status: CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED,
      })
      recipientModel.findAll.mockResolvedValue([row])

      await service.send(validDto, 'user-1')

      expect(mailService.sendCustomEmail).not.toHaveBeenCalled()
      // Nothing to update — the row is already in its final state.
      expect(row.update).not.toHaveBeenCalled()
      expect(companyEventService.emitCustomEmailOutcome).toHaveBeenCalledWith(
        'company-1',
        expect.anything(),
        CompanyEventTypeEnum.CUSTOM_EMAIL_SKIPPED,
        'batch-1',
        'Áminning',
        'user-1',
        'fyrirtæki í sóttkví',
      )
    })

    it('does not re-record a skip when resuming a batch already in SENDING', async () => {
      // A container that died mid-send leaves the batch in SENDING. Re-walking
      // it must not double every skip entry that the first run already wrote.
      companyEmailModel.findOne.mockResolvedValue({
        status: CompanyEmailStatusEnum.SENDING,
      })
      recipientModel.findAll.mockResolvedValue([
        makeRow({ status: CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL }),
      ])

      await service.send(validDto, 'user-1')

      expect(companyEventService.emitCustomEmailOutcome).not.toHaveBeenCalled()
    })

    it('marks the batch FAILED when the loop itself faults', async () => {
      // A database fault, not one recipient's — this must abort rather than
      // walk another 1 699 rows writing updates that will never commit.
      recipientModel.findAll.mockRejectedValue(new Error('connection lost'))

      await service.send(validDto, 'user-1')

      expect(companyEmailModel.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: CompanyEmailStatusEnum.FAILED }),
        expect.anything(),
      )
      expect(logger.error).toHaveBeenCalled()
    })

    it('keeps delivering when a timeline write fails', async () => {
      const rows = [makeRow({ companyId: 'a' }), makeRow({ companyId: 'b' })]
      recipientModel.findAll.mockResolvedValue(rows)
      companyEventService.emitCustomEmailOutcome.mockRejectedValueOnce(
        new Error('event write failed'),
      )

      await service.send(validDto, 'user-1')

      // The mail is already out; losing one audit line must not abort a batch
      // that is still delivering to everyone else.
      expect(mailService.sendCustomEmail).toHaveBeenCalledTimes(2)
      expect(companyEmailModel.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: CompanyEmailStatusEnum.COMPLETED }),
        expect.anything(),
      )
    })
  })

  describe('attachment archiving', () => {
    const originalBucket = process.env.AWS_DOE_COMPANY_FILES_BUCKET

    afterEach(() => {
      if (originalBucket === undefined) {
        delete process.env.AWS_DOE_COMPANY_FILES_BUCKET
      } else {
        process.env.AWS_DOE_COMPANY_FILES_BUCKET = originalBucket
      }
    })

    const makeAttachmentRow = () => {
      const row = {
        filename: 'bref.pdf',
        s3Key: 'doe-imports/mail-attachment/x.pdf',
        archived: false,
        update: jest.fn(),
      }
      row.update.mockImplementation(async (values: Record<string, unknown>) => {
        Object.assign(row, values)
        return row
      })
      return row
    }

    it('moves the file to the company-files bucket under the batch prefix', async () => {
      process.env.AWS_DOE_COMPANY_FILES_BUCKET = 'doe-company-files'
      uploadService.fetchObject.mockResolvedValue(Buffer.alloc(10))
      aws.uploadObject.mockResolvedValue(ResultWrapper.ok('ok'))
      const row = makeAttachmentRow()
      attachmentModel.findAll.mockResolvedValue([row])

      await service.send(
        {
          ...validDto,
          attachments: [
            { key: 'doe-imports/mail-attachment/x.pdf', filename: 'bref.pdf' },
          ],
        },
        'user-1',
      )

      // ⚠️ One copy per BATCH, not per recipient — a company-keyed archive would
      // write the same file once per company.
      expect(aws.uploadObject).toHaveBeenCalledWith(
        'doe-company-files',
        'company-emails/batch-1/bref.pdf',
        'bref.pdf',
        expect.any(Buffer),
      )
      expect(row.archived).toBe(true)
      /*
       * ⚠️ The STAGING key, not the archive key it was just updated to.
       * `row.update` mutates `s3Key` in place, so reading it back after the
       * update hands `cleanupAfter` a key outside the mail-attachment prefix —
       * which the boundary check refuses, leaving the staged object behind
       * forever behind a misleading "outside its prefix" warning.
       */
      expect(uploadService.cleanupAfter).toHaveBeenCalledWith(
        'doe-imports/mail-attachment/x.pdf',
        ImportUploadBoundary.MAIL_ATTACHMENT,
      )
    })

    it('keeps the staged object when no archive bucket is configured', async () => {
      /*
       * ⚠️ The live state today: AWS_DOE_COMPANY_FILES_BUCKET is deliberately
       * optional and that bucket is not provisioned. Deleting the staged object
       * with nowhere to have put it would destroy the only copy of a file that
       * really was sent to companies.
       */
      delete process.env.AWS_DOE_COMPANY_FILES_BUCKET
      uploadService.fetchObject.mockResolvedValue(Buffer.alloc(10))
      attachmentModel.findAll.mockResolvedValue([makeAttachmentRow()])

      await service.send(
        {
          ...validDto,
          attachments: [
            { key: 'doe-imports/mail-attachment/x.pdf', filename: 'bref.pdf' },
          ],
        },
        'user-1',
      )

      expect(aws.uploadObject).not.toHaveBeenCalled()
      expect(uploadService.cleanupAfter).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalled()
    })
  })
})
