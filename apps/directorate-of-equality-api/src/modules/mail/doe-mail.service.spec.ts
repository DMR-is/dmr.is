import { ReportModel } from '../report/models/report.model'
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
    aws.sendMail.mockResolvedValue(undefined)

    await service.sendExternalCommentNotification(makeReport(), makeComment())

    expect(aws.sendMail).toHaveBeenCalledTimes(1)
    const [message] = aws.sendMail.mock.calls[0]
    expect(message.to).toBe('contact@example.is')
  })

  it('falls back to companyAdminEmail when contactEmail is null', async () => {
    aws.sendMail.mockResolvedValue(undefined)

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
    aws.sendMail.mockResolvedValue(undefined)

    await service.sendExternalCommentNotification(makeReport(), makeComment())

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.from).toBe('Jafnréttisstofa <dev-mailbox@example.com>')
    expect(message.replyTo).toBe('dev-mailbox@example.com')
  })

  it('falls back to noreply@jafnretti.is when env is unset', async () => {
    aws.sendMail.mockResolvedValue(undefined)

    await service.sendExternalCommentNotification(makeReport(), makeComment())

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.from).toBe('Jafnréttisstofa <noreply@jafnretti.is>')
  })

  it('HTML-escapes the comment body', async () => {
    aws.sendMail.mockResolvedValue(undefined)

    await service.sendExternalCommentNotification(
      makeReport(),
      makeComment({ body: '<script>alert("x")</script>' }),
    )

    const [message] = aws.sendMail.mock.calls[0]
    expect(message.html).not.toContain('<script>')
    expect(message.html).toContain('&lt;script&gt;')
  })

  it('logs and swallows SES errors so callers never throw', async () => {
    const error = new Error('SES is down')
    aws.sendMail.mockRejectedValue(error)

    await expect(
      service.sendExternalCommentNotification(makeReport(), makeComment()),
    ).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalled()
  })
})
