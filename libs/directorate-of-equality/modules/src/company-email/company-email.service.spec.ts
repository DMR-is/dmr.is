import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common'

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
      // `quarantined` halts all outbound activity, but the company must still be
      // listed: a recipient list that shrinks with no explanation cannot be
      // checked against the count the admin saw.
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
      // Order matters: calling a halted company "no address" would send the admin
      // off to fill one in.
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
      // nodemailer splits `to` on commas, so this would have delivered one
      // company's message to a second company.
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
      // Nulled rather than echoed back: showing an unusable address would suggest
      // the mail would have gone to it.
      expect(preview.skipped[0].email).toBeNull()
    })

    it('replaces the stored address with the one the admin typed', async () => {
      const preview = await service.preview({
        ...validDto,
        recipientEmails: ['annad@fyrirtaeki.is'],
      })

      expect(preview.recipients[0].email).toBe('annad@fyrirtaeki.is')
    })

    it('makes one recipient out of each address on a single-company send', async () => {
      // One row per address, because each is its own message — see
      // `resolveRecipients`.
      const preview = await service.preview({
        ...validDto,
        recipientEmails: ['framkvaemdastjori@x.is', 'mannaudur@x.is'],
      })

      expect(preview.recipientCount).toBe(2)
      expect(preview.recipients.map((r) => r.email)).toEqual([
        'framkvaemdastjori@x.is',
        'mannaudur@x.is',
      ])
      expect(preview.recipients.map((r) => r.companyId)).toEqual([
        'company-1',
        'company-1',
      ])
    })

    it('trims and de-duplicates the addresses case-insensitively', async () => {
      // The same address twice is one message.
      const preview = await service.preview({
        ...validDto,
        recipientEmails: [' Skra@Fyrirtaeki.is ', 'skra@fyrirtaeki.is', '  '],
      })

      expect(preview.recipients.map((r) => r.email)).toEqual([
        'Skra@Fyrirtaeki.is',
      ])
    })

    it('rejects an address that is not a single address', async () => {
      // A 400, not the silent skip an unusable stored address gets: this one is a
      // typo in a field the admin is looking at. The comma case matters most —
      // nodemailer splits `to` on commas.
      await expect(
        service.preview({
          ...validDto,
          recipientEmails: ['a@x.is, b@y.is'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('gives a quarantined company one skipped row however many addresses were typed', async () => {
      // Quarantine is a fact about the company; repeating it per address would
      // inflate the skipped count.
      companyService.findMailRecipientsByIds.mockResolvedValue([
        makeCompany({ quarantined: true }),
      ])

      const preview = await service.preview({
        ...validDto,
        recipientEmails: ['a@x.is', 'b@x.is'],
      })

      expect(preview.recipientCount).toBe(0)
      expect(preview.skipped).toHaveLength(1)
      expect(preview.skipped[0].reason).toBe(
        CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED,
      )
    })

    it('ignores typed addresses when more than one company is addressed', async () => {
      // There is no single company a bulk send's addresses could belong to, and
      // applying one typed address to every company is not recoverable.
      companyService.findMailRecipientsByIds.mockResolvedValue([
        makeCompany({ id: 'a', email: 'a@x.is' }),
        makeCompany({ id: 'b', email: 'b@x.is' }),
      ])

      const preview = await service.preview({
        ...validDto,
        companyIds: ['a', 'b'],
        recipientEmails: ['override@x.is'],
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

      // The list's own resolution, not a second copy of the filter logic — what
      // keeps the approved count and the set written to in agreement.
      expect(companyService.findMailRecipientsByFilter).toHaveBeenCalledWith({
        quarantined: false,
      })
    })
  })

  describe('preview', () => {
    it('returns the body already sanitised, so the confirmation step matches what is sent', async () => {
      // The admin approves what this step renders. Echoing the raw editor state
      // back would let them sign off on markup sanitise-html strips on the way out.
      const preview = await service.preview({
        ...validDto,
        bodyHtml: '<p onclick="steal()">Halló</p><script>x()</script>',
      })

      expect(preview.bodyHtml).toBe('<p>Halló</p>')
    })
  })

  describe('send', () => {
    it('sanitises the body once, before storing it', async () => {
      await service.send(
        { ...validDto, bodyHtml: '<p onclick="steal()">Halló</p><script>x()</script>' },
        'user-1',
      )

      const [created] = companyEmailModel.create.mock.calls[0]
      // Stored sanitised, so the delivered mail, the timeline read-back and what
      // `preview` showed are the same bytes.
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
      // import workbook.
      expect(uploadService.fetchObject).toHaveBeenCalledWith(
        attachment.key,
        ImportUploadBoundary.MAIL_ATTACHMENT,
        expect.any(Number),
      )
    })

    it('rejects attachments whose combined size exceeds the cap', async () => {
      // The running total, not the per-file size: five files each just under the
      // per-file cap would otherwise clear it together and be rejected by SES.
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

    it('deletes a discarded staged object through the mail-attachment boundary', async () => {
      await service.discardAttachment({ key: attachment.key })

      // No `error` argument — `cleanupAfter` reads that as "terminal, delete it".
      // The boundary is what makes a client-supplied key safe to pass.
      expect(uploadService.cleanupAfter).toHaveBeenCalledWith(
        attachment.key,
        ImportUploadBoundary.MAIL_ATTACHMENT,
      )
    })

    it('reports a 413 raised as a bare HttpException as "too large"', async () => {
      // A bare `HttpException`, the shape the S3 branch produces: the 413 travels
      // back through `ResultWrapper.unwrap`, which rethrows as
      // `new HttpException(message, code)`. Only local disk reads throw the subclass.
      uploadService.fetchObject.mockRejectedValue(
        new HttpException('too big', HttpStatus.PAYLOAD_TOO_LARGE),
      )

      await expect(
        service.send({ ...validDto, attachments: [attachment] }, 'user-1'),
      ).rejects.toThrow(/total limit/)

      expect(companyEmailModel.create).not.toHaveBeenCalled()
    })

    it('refuses more than the maximum attachment count at preview', async () => {
      // The cap belongs on the composing step: reaching it at send means the admin
      // has already cleared the confirmation.
      await expect(
        service.preview({
          ...validDto,
          attachments: Array.from({ length: 6 }, (_, i) => ({
            ...attachment,
            filename: `b${i}.pdf`,
          })),
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(uploadService.fetchObject).not.toHaveBeenCalled()
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
        // Joined in `deliver`, and the value the timeline event is recorded under.
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

    describe('the copy to the sender', () => {
      /** A queued batch that also carries a copy address. */
      const queuedWithCopy = (copySentAt: Date | null = null) => {
        companyEmailModel.findOne.mockResolvedValue({
          status: CompanyEmailStatusEnum.QUEUED,
          copyToEmail: 'disa@jafnretti.is',
          copySentAt,
        })
      }

      it('sends exactly one copy however many recipients the batch has', async () => {
        // A per-message BCC on a send aimed at the register would put ~1700
        // identical copies in one inbox.
        queuedWithCopy()
        recipientModel.findAll.mockResolvedValue([
          makeRow({ companyId: 'a', email: 'a@x.is' }),
          makeRow({ companyId: 'b', email: 'b@x.is' }),
          makeRow({ companyId: 'c', email: 'c@x.is' }),
        ])

        await service.send(
          { ...validDto, copyToEmail: 'disa@jafnretti.is' },
          'user-1',
        )

        const copies = mailService.sendCustomEmail.mock.calls.filter(
          ([to]) => to === 'disa@jafnretti.is',
        )
        expect(copies).toHaveLength(1)
        // Identical to what the companies receive, not a paraphrase of it.
        expect(copies[0].slice(1, 3)).toEqual(['Áminning', '<p>Halló</p>'])
      })

      it('stores the copy address on the batch', async () => {
        await service.send(
          { ...validDto, copyToEmail: '  disa@jafnretti.is  ' },
          'user-1',
        )

        expect(companyEmailModel.create).toHaveBeenCalledWith(
          expect.objectContaining({ copyToEmail: 'disa@jafnretti.is' }),
        )
      })

      it('records when the copy went out, so a resume cannot send a second', async () => {
        queuedWithCopy()
        recipientModel.findAll.mockResolvedValue([makeRow()])

        await service.send(
          { ...validDto, copyToEmail: 'disa@jafnretti.is' },
          'user-1',
        )

        expect(companyEmailModel.update).toHaveBeenCalledWith(
          expect.objectContaining({ copySentAt: expect.any(Date) }),
          { where: { id: 'batch-1' } },
        )
      })

      it('does not repeat the copy on a resumed batch', async () => {
        companyEmailModel.findOne.mockResolvedValue({
          status: CompanyEmailStatusEnum.SENDING,
          copyToEmail: 'disa@jafnretti.is',
          copySentAt: new Date(),
        })
        recipientModel.findAll.mockResolvedValue([makeRow()])

        await service.send(
          { ...validDto, copyToEmail: 'disa@jafnretti.is' },
          'user-1',
        )

        expect(mailService.sendCustomEmail).not.toHaveBeenCalledWith(
          'disa@jafnretti.is',
          expect.anything(),
          expect.anything(),
          expect.anything(),
        )
      })

      it('completes the batch even when the copy cannot be sent', async () => {
        // Mail that reached the companies must not be recorded as a failed batch
        // because the sender's copy did not go.
        queuedWithCopy()
        recipientModel.findAll.mockResolvedValue([makeRow()])
        mailService.sendCustomEmail.mockImplementation(async (to: string) =>
          to === 'disa@jafnretti.is'
            ? { ok: false, error: 'SES sagði nei' }
            : { ok: true },
        )

        await service.send(
          { ...validDto, copyToEmail: 'disa@jafnretti.is' },
          'user-1',
        )

        expect(companyEmailModel.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: CompanyEmailStatusEnum.COMPLETED,
          }),
          { where: { id: 'batch-1' } },
        )
        // Left null on a failure, which is what lets a resume try again.
        expect(companyEmailModel.update).not.toHaveBeenCalledWith(
          expect.objectContaining({ copySentAt: expect.any(Date) }),
          expect.anything(),
        )
      })

      it('writes no recipient row and no timeline entry for the copy', async () => {
        // It belongs to no company: counting it among the companies mailed would
        // misstate the send.
        queuedWithCopy()
        recipientModel.findAll.mockResolvedValue([makeRow()])

        await service.send(
          { ...validDto, copyToEmail: 'disa@jafnretti.is' },
          'user-1',
        )

        expect(recipientModel.bulkCreate).toHaveBeenCalledWith([
          expect.objectContaining({ email: 'skra@fyrirtaeki.is' }),
        ])
        expect(companyEventService.emitCustomEmailOutcome).toHaveBeenCalledTimes(
          1,
        )
      })

      it('rejects a copy address that is not a single address', async () => {
        await expect(
          service.preview({ ...validDto, copyToEmail: 'a@x.is, b@y.is' }),
        ).rejects.toBeInstanceOf(BadRequestException)
      })
    })

    it("records the event under the company's own register status", async () => {
      // Nothing constrains a send to ACTIVE companies, and `company_event.status`
      // is NOT NULL on an immutable table — a constant here would be a false row.
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
      // One bad address must not cost the other 1699 companies their message.
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
      // Nothing else writes the skip — the resolve step only sets the row's
      // status. An early return here left CUSTOM_EMAIL_SKIPPED unreachable.
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
      // A container that died mid-send leaves the batch in SENDING. Re-walking it
      // must not double every skip entry the first run wrote.
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
      // A database fault, not one recipient's — abort rather than walk another
      // 1699 rows writing updates that will never commit.
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

      // The mail is already out; losing one audit line must not abort a batch that
      // is still delivering.
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

    const makeAttachmentRow = (overrides: Record<string, unknown> = {}) => {
      const row = {
        filename: 'bref.pdf',
        s3Key: 'doe-imports/mail-attachment/x.pdf',
        archived: false,
        update: jest.fn(),
        ...overrides,
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

      // One copy per BATCH, not per recipient — a company-keyed archive would write
      // the same file once per company.
      expect(aws.uploadObject).toHaveBeenCalledWith(
        'doe-company-files',
        // The staged basename, not `filename`: server generated, so unique.
        'company-emails/batch-1/x.pdf',
        'bref.pdf',
        expect.any(Buffer),
      )
      expect(row.archived).toBe(true)
      // The STAGING key, not the archive key it was just updated to: `row.update`
      // mutates `s3Key` in place, and a key outside the mail-attachment prefix is
      // refused by the boundary check.
      expect(uploadService.cleanupAfter).toHaveBeenCalledWith(
        'doe-imports/mail-attachment/x.pdf',
        ImportUploadBoundary.MAIL_ATTACHMENT,
      )
    })

    it('keeps the staged object when no archive bucket is configured', async () => {
      // AWS_DOE_COMPANY_FILES_BUCKET is optional and not provisioned. Deleting the
      // staged object with nowhere to have put it would destroy the only copy.
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

    it('gives two attachments sharing a filename separate archive keys', async () => {
      // Nothing stops an admin attaching two files with the same name. Keying the
      // archive by `filename` would leave the second overwriting the first.
      process.env.AWS_DOE_COMPANY_FILES_BUCKET = 'doe-company-files'
      uploadService.fetchObject.mockResolvedValue(Buffer.alloc(10))
      aws.uploadObject.mockResolvedValue(ResultWrapper.ok('ok'))
      attachmentModel.findAll.mockResolvedValue([
        makeAttachmentRow({ s3Key: 'doe-imports/mail-attachment/a.pdf' }),
        makeAttachmentRow({ s3Key: 'doe-imports/mail-attachment/b.pdf' }),
      ])

      await service.send(
        {
          ...validDto,
          attachments: [
            { key: 'doe-imports/mail-attachment/a.pdf', filename: 'bref.pdf' },
            { key: 'doe-imports/mail-attachment/b.pdf', filename: 'bref.pdf' },
          ],
        },
        'user-1',
      )

      const keys = aws.uploadObject.mock.calls.map(([, key]) => key)
      expect(keys).toEqual([
        'company-emails/batch-1/a.pdf',
        'company-emails/batch-1/b.pdf',
      ])
    })

    it('still archives when the batch aborts', async () => {
      // An aborted batch has usually already sent to some recipients, so its
      // attachments belong in the audit record too.
      process.env.AWS_DOE_COMPANY_FILES_BUCKET = 'doe-company-files'
      uploadService.fetchObject.mockResolvedValue(Buffer.alloc(10))
      aws.uploadObject.mockResolvedValue(ResultWrapper.ok('ok'))
      attachmentModel.findAll.mockResolvedValue([makeAttachmentRow()])
      recipientModel.findAll.mockRejectedValue(new Error('connection lost'))

      await service.send(
        {
          ...validDto,
          attachments: [
            { key: 'doe-imports/mail-attachment/x.pdf', filename: 'bref.pdf' },
          ],
        },
        'user-1',
      )

      expect(companyEmailModel.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: CompanyEmailStatusEnum.FAILED }),
        expect.anything(),
      )
      expect(uploadService.cleanupAfter).toHaveBeenCalledWith(
        'doe-imports/mail-attachment/x.pdf',
        ImportUploadBoundary.MAIL_ATTACHMENT,
      )
    })

    it('strips characters that would break out of the Content-Disposition header', async () => {
      process.env.AWS_DOE_COMPANY_FILES_BUCKET = 'doe-company-files'
      uploadService.fetchObject.mockResolvedValue(Buffer.alloc(10))
      aws.uploadObject.mockResolvedValue(ResultWrapper.ok('ok'))
      attachmentModel.findAll.mockResolvedValue([
        makeAttachmentRow({ filename: '../a"b.pdf' }),
      ])

      await service.send(
        {
          ...validDto,
          attachments: [
            {
              key: 'doe-imports/mail-attachment/x.pdf',
              filename: '../a"b.pdf',
            },
          ],
        },
        'user-1',
      )

      // `uploadObject` interpolates this into `inline; filename="…"` unescaped.
      const [, key, headerName] = aws.uploadObject.mock.calls[0]
      expect(key).toBe('company-emails/batch-1/x.pdf')
      expect(headerName).toBe('..ab.pdf')
    })
  })
})
