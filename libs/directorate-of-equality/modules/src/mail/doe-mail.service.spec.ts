import { ResultWrapper } from '@dmr.is/types'

import {
  ReportModel,
  ReportProviderEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import { ReportCommentModel } from '../report-comment/models/report-comment.model'
import { DoeMailService } from './doe-mail.service'

describe('DoeMailService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const aws = {
    sendMail: jest.fn(),
  }

  let service: DoeMailService
  const originalFromEnv = process.env.SEND_FROM_EMAIL_ADDRESS

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.SEND_FROM_EMAIL_ADDRESS
    service = new DoeMailService(logger as never, aws as never)
  })

  afterAll(() => {
    if (originalFromEnv === undefined) {
      delete process.env.SEND_FROM_EMAIL_ADDRESS
    } else {
      process.env.SEND_FROM_EMAIL_ADDRESS = originalFromEnv
    }
  })

  const makeReport = (overrides: Partial<ReportModel> = {}): ReportModel =>
    ({
      id: 'report-1',
      contactEmail: 'contact@example.is',
      companyAdminEmail: 'admin@example.is',
      ...overrides,
    } as ReportModel)

  const makeComment = (overrides: Partial<ReportCommentModel> = {}): ReportCommentModel =>
    ({
      id: 'comment-1',
      body: 'Hello there',
      ...overrides,
    } as ReportCommentModel)

  it('sends to contactEmail when present', async () => {
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(makeReport(), makeComment())

    expect(aws.sendMail).toHaveBeenCalledTimes(1)
    const [message] = aws.sendMail.mock.calls[0]
    expect(message.to).toBe('contact@example.is')
  })

  it('falls back to companyAdminEmail when contactEmail is null', async () => {
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(
      makeReport({ contactEmail: null }),
      makeComment(),
    )

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.to).toBe('admin@example.is')
  })

  it('skips and warns when both recipient fields are null', async () => {
    await service.sendExternalCommentNotification(
      makeReport({ contactEmail: null, companyAdminEmail: null }),
      makeComment(),
    )

    expect(aws.sendMail).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('uses SEND_FROM_EMAIL_ADDRESS when set', async () => {
    process.env.SEND_FROM_EMAIL_ADDRESS = 'dev-mailbox@example.com'
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(makeReport(), makeComment())

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.from).toBe('Jafnréttisstofa <dev-mailbox@example.com>')
    expect(message.replyTo).toBe('dev-mailbox@example.com')
  })

  it('falls back to noreply@jafnretti.is when env is unset', async () => {
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(makeReport(), makeComment())

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.from).toBe('Jafnréttisstofa <noreply@jafnretti.is>')
  })

  it('HTML-escapes the comment body', async () => {
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(
      makeReport(),
      makeComment({ body: '<script>alert("x")</script>' }),
    )

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.html).not.toContain('<script>')
    expect(message.html).toContain('&lt;script&gt;')
  })

  it('includes the island.is application link when provider is ISLAND_IS, for salary reports', async () => {
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(
      makeReport({
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: 'abc-123',
        type: ReportTypeEnum.SALARY,
      }),
      makeComment(),
    )

    const [message] = aws.sendMail.mock.calls[0]
    const expectedUrl = 'https://island.is/umsoknir/jafnrettisstofa-skyrslugjof/abc-123'
    expect(message.html).toContain(`href="${expectedUrl}"`)
    expect(message.html).toContain('Skoða umsókn')
    expect(message.text).toContain(expectedUrl)
  })

    it('includes the island.is application link when provider is ISLAND_IS, for equality reports', async () => {
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(
      makeReport({
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: 'abc-123',
        type: ReportTypeEnum.EQUALITY,
      }),
      makeComment(),
    )

    const [message] = aws.sendMail.mock.calls[0]
    const expectedUrl = 'https://island.is/umsoknir/jafnrettisstofa-jafnrettisaaetlun/abc-123'
    expect(message.html).toContain(`href="${expectedUrl}"`)
    expect(message.html).toContain('Skoða umsókn')
    expect(message.text).toContain(expectedUrl)
  })

  it('omits the application link for non-island.is providers', async () => {
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(
      makeReport({
        providerType: ReportProviderEnum.SYSTEM,
        providerId: 'abc-123',
      }),
      makeComment(),
    )

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.html).not.toContain('island.is/umsoknir/jafnrettisstofa')
    expect(message.text).not.toContain('Skoða umsókn')
  })

  it('omits the application link when providerId is missing', async () => {
    aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

    await service.sendExternalCommentNotification(
      makeReport({
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: null,
      }),
      makeComment(),
    )

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.html).not.toContain('island.is/umsoknir/jafnrettisstofa')
  })

  describe('sendReportDenied', () => {
    it('subjects an equality denial "Jafnréttisáætlun hafnað"', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportDenied(
        makeReport({ type: ReportTypeEnum.EQUALITY }),
        'Vantar gögn',
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.subject).toBe('Jafnréttisáætlun hafnað')
    })

    it('subjects a salary denial "Skýrslugjöf hafnað"', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportDenied(
        makeReport({ type: ReportTypeEnum.SALARY }),
        'Vantar gögn',
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.subject).toBe('Skýrslugjöf hafnað')
    })

    it('carries the denial reason as the body', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportDenied(
        makeReport({ type: ReportTypeEnum.SALARY }),
        'Frávik voru ekki skýrð',
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.html).toContain('Frávik voru ekki skýrð')
      expect(message.text).toContain('Frávik voru ekki skýrð')
    })

    it('HTML-escapes the denial reason and keeps line breaks', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportDenied(
        makeReport({ type: ReportTypeEnum.SALARY }),
        '<script>alert("x")</script>\nlína tvö',
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.html).not.toContain('<script>')
      expect(message.html).toContain('&lt;script&gt;')
      expect(message.html).toContain('<br/>')
    })

    /**
     * `deny` closes the communication thread and does not reopen the island.is
     * application, so any invitation to reply would point at a shut channel.
     */
    it('does not invite a reply or link the application', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportDenied(
        makeReport({
          type: ReportTypeEnum.EQUALITY,
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: 'abc-123',
        }),
        'reason',
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.html).not.toContain('island.is/umsoknir')
      expect(message.text).not.toContain('Skoða umsókn')
    })

    it('resolves the recipient the same way as the comment notification', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportDenied(
        makeReport({ type: ReportTypeEnum.SALARY, contactEmail: null }),
        'reason',
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.to).toBe('admin@example.is')
    })

    it('skips and warns when the report names no recipient', async () => {
      await service.sendReportDenied(
        makeReport({
          type: ReportTypeEnum.SALARY,
          contactEmail: null,
          companyAdminEmail: null,
        }),
        'reason',
      )

      expect(aws.sendMail).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalled()
    })

    it('logs and swallows SES errors so the denial stands', async () => {
      aws.sendMail.mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'SES is down' }),
      )

      await expect(
        service.sendReportDenied(
          makeReport({ type: ReportTypeEnum.SALARY }),
          'reason',
        ),
      ).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalled()
    })
  })

  /**
   * ⚠️ The reachable failure path. `sendMail` is `@LogAndHandle()`-decorated and
   * resolves `ResultWrapper.err` instead of rejecting, so this — not a
   * rejection — is what a hard SES failure looks like to this service. Before
   * the fix it fell through to `logger.info('Sent ...')`, leaving an approved
   * report with an undelivered notice and a log line claiming success.
   */
  describe('an err result from sendMail', () => {
    it('logs an error and never claims the mail was sent', async () => {
      aws.sendMail.mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'SES rejected the message' }),
      )

      await service.sendReportApproved(
        makeReport({ type: ReportTypeEnum.EQUALITY }),
        [
          {
            filename: 'a.pdf',
            content: Buffer.from('x'),
            label: 'jafnréttisáætlun',
          },
        ],
      )

      expect(logger.error).toHaveBeenCalled()
      const sentInfo = logger.info.mock.calls.filter(([msg]) =>
        String(msg).startsWith('Sent '),
      )
      expect(sentInfo).toHaveLength(0)
    })

    it('carries the failure message, not an empty serialized Error', async () => {
      aws.sendMail.mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'SES rejected the message' }),
      )

      await service.sendReportDenied(
        makeReport({ type: ReportTypeEnum.SALARY }),
        'reason',
      )

      const [, meta] = logger.error.mock.calls[0]
      expect(meta.errorMessage).toBe('SES rejected the message')
    })

    /**
     * The reminder task records the event as sent only when this resolves, so a
     * failure has to surface as a throw or the company silently loses that tier.
     */
    it('throws from the deadline reminder so the task retries it', async () => {
      aws.sendMail.mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'SES is down' }),
      )

      await expect(
        service.sendReportDeadlineReminder('to@example.is', {
          companyName: 'Test ehf.',
          reportType: ReportTypeEnum.SALARY,
          tier: 'DUE',
          dueDate: new Date(2026, 4, 21),
        } as never),
      ).rejects.toThrow(/SES is down/)
    })
  })

  describe('recipient resolution', () => {
    // `contactEmail` is `IsString()` only — no `@IsEmail`, no `MinLength` — so a
    // stored '' is valid, and `??` would return it and skip the send.
    it.each([
      ['empty string', ''],
      ['whitespace', '   '],
    ])('falls back to companyAdminEmail when contactEmail is %s', async (
      _label,
      contactEmail,
    ) => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportDenied(
        makeReport({ type: ReportTypeEnum.SALARY, contactEmail }),
        'reason',
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.to).toBe('admin@example.is')
    })

    it('trims a padded recipient', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportDenied(
        makeReport({
          type: ReportTypeEnum.SALARY,
          contactEmail: '  contact@example.is  ',
        }),
        'reason',
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.to).toBe('contact@example.is')
    })

    /*
     * ⚠️ **The mutant the other cases do not kill.** `''` and `'   '` are both
     * falsy after the `.trim()` that runs first, and a padded valid address is
     * still valid — so `.find(c => !!c)` passes all three, and reverting the
     * address test would have gone unnoticed. These are the truthy-but-unusable
     * values, which is the whole point of the guard.
     */
    it.each([
      ['a missing at-sign', 'jon.example.is'],
      ['a comma-separated list', 'a@x.is, b@y.is'],
      ['a semicolon-separated list', 'a@x.is;b@y.is'],
      ['an angle-bracketed display name', 'Jón <jon@x.is>'],
      ['interior whitespace', 'jon @x.is'],
    ])(
      'falls back to companyAdminEmail when contactEmail has %s',
      async (_label, contactEmail) => {
        aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

        await service.sendReportDenied(
          makeReport({ type: ReportTypeEnum.SALARY, contactEmail }),
          'reason',
        )

        const [message] = aws.sendMail.mock.calls[0]
        expect(message.to).toBe('admin@example.is')
      },
    )

    // Nodemailer splits `to` on commas, so a list that reached it would send the
    // approval's pay-gap PDFs to every address in it. Neither candidate is
    // usable here, so nothing goes at all.
    it('sends nothing when neither candidate is a single address', async () => {
      await service.sendReportDenied(
        makeReport({
          type: ReportTypeEnum.SALARY,
          contactEmail: 'a@x.is, b@y.is',
          companyAdminEmail: 'not-an-address',
        }),
        'reason',
      )

      expect(aws.sendMail).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalled()
    })
  })

  /*
   * ⚠️ `IAWSService.sendMail` is DECLARED `Promise<SentMessageInfo>`, and
   * `SentMessageInfo` is `any`. The implementation actually resolves a
   * `ResultWrapper` and never rejects, because `@LogAndHandle()`'s catch returns
   * `handleException(...)`. Nothing in the type system holds either shape, so
   * `sendMailResult` checks at runtime and both branches are pinned here — a
   * later "cleanup" that makes the implementation honour its declaration must not
   * turn a successful send into a failure.
   */
  describe('sendMailResult narrowing', () => {
    it('treats an err result as a failed send', async () => {
      aws.sendMail.mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'SES is down' }),
      )

      await expect(
        service.sendReportApproved(
          makeReport({ type: ReportTypeEnum.EQUALITY }),
          [],
        ),
      ).resolves.toBe(false)
    })

    // The DECLARED shape: a bare `SentMessageInfo`. Returning a value at all
    // means the send succeeded under that contract, so it must not read as a
    // failure and skip the S3 archive.
    it('treats a bare non-ResultWrapper return as a delivered send', async () => {
      aws.sendMail.mockResolvedValue({ messageId: '<abc@ses>' })

      await expect(
        service.sendReportApproved(
          makeReport({ type: ReportTypeEnum.EQUALITY }),
          [],
        ),
      ).resolves.toBe(true)
      expect(logger.error).not.toHaveBeenCalled()
    })

    // Same for `undefined`, which is what a void implementation would give.
    it('treats undefined as a delivered send rather than a failure', async () => {
      aws.sendMail.mockResolvedValue(undefined)

      await expect(
        service.sendReportApproved(
          makeReport({ type: ReportTypeEnum.EQUALITY }),
          [],
        ),
      ).resolves.toBe(true)
    })
  })

  describe('sendReportApproved', () => {
    const pdf = (name: string) => ({
      filename: name,
      content: Buffer.from(`${name}-bytes`),
      label: name.replace('.pdf', ''),
    })

    it('subjects an equality approval "Jafnréttisáætlun samþykkt"', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportApproved(
        makeReport({ type: ReportTypeEnum.EQUALITY }),
        [pdf('jafnréttisáætlun.pdf')],
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.subject).toBe('Jafnréttisáætlun samþykkt')
    })

    it('subjects a salary approval "Skýrslugjöf samþykkt"', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportApproved(
        makeReport({ type: ReportTypeEnum.SALARY }),
        [pdf('jafnlaunaúttekt.pdf')],
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.subject).toBe('Skýrslugjöf samþykkt')
    })

    it('attaches the documents it is handed, stripped of the label', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportApproved(
        makeReport({ type: ReportTypeEnum.SALARY }),
        [pdf('jafnlaunaúttekt.pdf'), pdf('úrbótaáætlun.pdf')],
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.attachments).toEqual([
        {
          filename: 'jafnlaunaúttekt.pdf',
          content: Buffer.from('jafnlaunaúttekt.pdf-bytes'),
        },
        {
          filename: 'úrbótaáætlun.pdf',
          content: Buffer.from('úrbótaáætlun.pdf-bytes'),
        },
      ])
    })

    /**
     * An unnamed second attachment reads as a duplicate of the first, so the
     * body enumerates what is attached.
     */
    it('names every attachment in the body', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportApproved(
        makeReport({ type: ReportTypeEnum.SALARY }),
        [pdf('jafnlaunaúttekt.pdf'), pdf('úrbótaáætlun.pdf')],
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.text).toContain('jafnlaunaúttekt, úrbótaáætlun')
      expect(message.html).toContain('jafnlaunaúttekt, úrbótaáætlun')
    })

    it('states the validity period', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportApproved(
        makeReport({
          type: ReportTypeEnum.EQUALITY,
          validUntil: new Date('2029-08-31T00:00:00.000Z'),
        }),
        [pdf('jafnréttisáætlun.pdf')],
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.text).toContain('gildir til 31.08.2029')
      expect(message.html).toContain('gildir til 31.08.2029')
    })

    it('renders an em dash rather than Invalid Date when validUntil is absent', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await service.sendReportApproved(
        makeReport({ type: ReportTypeEnum.EQUALITY, validUntil: null }),
        [pdf('jafnréttisáætlun.pdf')],
      )

      const [message] = aws.sendMail.mock.calls[0]
      expect(message.text).toContain('gildir til —')
      expect(message.text).not.toContain('Invalid Date')
    })

    it('skips and warns when the report names no recipient', async () => {
      await service.sendReportApproved(
        makeReport({
          type: ReportTypeEnum.EQUALITY,
          contactEmail: null,
          companyAdminEmail: null,
        }),
        [pdf('jafnréttisáætlun.pdf')],
      )

      expect(aws.sendMail).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalled()
    })

    // ⚠️ Resolves FALSE rather than throwing: the approval is already committed,
    // so the reviewer must not see an error — but the caller has to know, because
    // it archives these same attachments to S3 as the record of what was sent.
    it('logs and reports a failed send so the approval stands and nothing is archived', async () => {
      aws.sendMail.mockResolvedValue(
        ResultWrapper.err({ code: 500, message: 'SES is down' }),
      )

      await expect(
        service.sendReportApproved(
          makeReport({ type: ReportTypeEnum.EQUALITY }),
          [pdf('jafnréttisáætlun.pdf')],
        ),
      ).resolves.toBe(false)

      expect(logger.error).toHaveBeenCalled()
    })

    it('reports a delivered send', async () => {
      aws.sendMail.mockResolvedValue(ResultWrapper.ok(undefined))

      await expect(
        service.sendReportApproved(
          makeReport({ type: ReportTypeEnum.EQUALITY }),
          [pdf('jafnréttisáætlun.pdf')],
        ),
      ).resolves.toBe(true)
    })
  })

  it('logs and swallows SES errors so callers never throw', async () => {
    // ⚠️ Resolves an err RESULT, not a rejection: `sendMail` is decorated
    // `@LogAndHandle()` and cannot reject. Asserting on a rejection passed while
    // pinning the opposite of production, and is what made the swallow look
    // covered.
    aws.sendMail.mockResolvedValue(
      ResultWrapper.err({ code: 500, message: 'SES is down' }),
    )

    await expect(
      service.sendExternalCommentNotification(makeReport(), makeComment()),
    ).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalled()
  })
})
