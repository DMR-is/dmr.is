import { NoticeOutboxKindEnum } from './models/notice-outbox.enums'
import { NoticeOutboxService } from './notice-outbox.service'

describe('NoticeOutboxService', () => {
  const noticeOutboxModel = { create: jest.fn() }

  let service: NoticeOutboxService

  beforeEach(() => {
    jest.clearAllMocks()
    noticeOutboxModel.create.mockResolvedValue({ id: 'notice-1' })
    service = new NoticeOutboxService(noticeOutboxModel as never)
  })

  /*
   * No `transaction` option, deliberately: the row must join the ambient CLS
   * transaction of the change that owes the notice, so the two commit or roll
   * back together. Passing `transaction: null` here would let a notice survive
   * a rolled-back approval.
   */
  it('writes a PENDING row for the kind and report, inside the ambient transaction', async () => {
    await service.enqueue(NoticeOutboxKindEnum.REPORT_APPROVED, 'report-1')

    expect(noticeOutboxModel.create).toHaveBeenCalledWith({
      kind: NoticeOutboxKindEnum.REPORT_APPROVED,
      reportId: 'report-1',
    })
    expect(noticeOutboxModel.create.mock.calls[0]).toHaveLength(1)
  })

  // A report is submitted once and decided once; the unique constraint turns a
  // second row into a failed transaction rather than a second notice.
  it('lets a duplicate fail the caller', async () => {
    noticeOutboxModel.create.mockRejectedValue(new Error('unique violation'))

    await expect(
      service.enqueue(NoticeOutboxKindEnum.REPORT_DENIED, 'report-1'),
    ).rejects.toThrow('unique violation')
  })
})
