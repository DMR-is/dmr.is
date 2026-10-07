import { CaseActionEnum } from '@dmr.is/shared-dto'
import { IAWSService } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'

import { CommentServiceV2 } from './comment.service'

const CASE_ID = 'case-1'

describe('CommentServiceV2.createExternalComment', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
  const commentModel = { create: jest.fn(), findByPk: jest.fn() }
  const caseActionModel = { findOne: jest.fn() }
  const commentsModel = { create: jest.fn() }
  const caseModel = { findByPk: jest.fn() }
  const sequelize = {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
  }
  const awsService = { sendMail: jest.fn() }

  let service: CommentServiceV2

  beforeEach(() => {
    jest.clearAllMocks()

    // First lookup: getCreateValues. Second: the case the email is about.
    caseModel.findByPk
      .mockResolvedValueOnce({
        status: { id: 'status-1' },
        involvedParty: { id: 'party-1' },
      })
      .mockResolvedValueOnce({
        caseNumber: '12345',
        advertTitle: 'Auglýsing',
        advertType: { title: 'Reglugerð' },
        channels: [{ email: 'channel@example.is' }, { email: null }],
      })
    caseActionModel.findOne.mockResolvedValue({ id: 'action-1' })
    commentModel.findByPk.mockResolvedValue({
      id: 'comment-1',
      created: '2026-10-07T00:00:00.000Z',
      comment: 'Athugasemd',
      userCreatorId: 'user-1',
      userCreator: { displayName: 'Starfsmaður' },
      caseAction: { title: CaseActionEnum.COMMENT_EXTERNAL },
      createdCaseStatus: { id: 'status-1', title: 'Innsent', slug: 'innsent' },
    })

    service = new CommentServiceV2(
      logger as never,
      commentModel as never,
      caseActionModel as never,
      commentsModel as never,
      caseModel as never,
      sequelize as never,
      awsService as unknown as IAWSService,
    )
  })

  const create = () =>
    service.createExternalComment(CASE_ID, {
      adminUserCreatorId: 'user-1',
      comment: 'Athugasemd',
    })

  it('emails every channel that has an address', async () => {
    awsService.sendMail.mockResolvedValue(
      ResultWrapper.ok({ envelope: { from: false, to: [] }, messageId: 'id' }),
    )

    const result = await create()

    expect(result.result.ok).toBe(true)
    expect(awsService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'channel@example.is' }),
    )
    expect(logger.warn).not.toHaveBeenCalled()
  })

  // `sendMail` never rejects: a failed send arrives as an err result, so this
  // branch, not a catch, is what logs it.
  it('logs a failed email and still returns the comment', async () => {
    const error = { code: 500, message: 'SES is down' }
    awsService.sendMail.mockResolvedValue(ResultWrapper.err(error))

    const result = await create()

    expect(result.result.ok).toBe(true)
    expect(logger.warn).toHaveBeenCalledWith(
      'Email not sent',
      expect.objectContaining({ error, caseId: CASE_ID }),
    )
  })
})
