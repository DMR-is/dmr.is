import { createNamespace, destroyNamespace } from 'cls-hooked'

import { BadRequestException, ForbiddenException } from '@nestjs/common'

import { CLS_NAMESPACE } from '@dmr.is/constants'

import {
  CommunicationStatusEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { DenyReportDto } from './dto/deny-report.dto'
import { ReportWorkflowService } from './report-workflow.service'

describe('ReportWorkflowService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const reportEventService = {
    emitSubmitted: jest.fn(),
    emitAssigned: jest.fn(),
    emitUnassigned: jest.fn(),
    emitStatusChanged: jest.fn(),
    emitSuperseded: jest.fn(),
    emitEdited: jest.fn(),
  }

  const applicationSystemService = {
    notifyApproved: jest.fn(),
    notifyDenied: jest.fn(),
    notifyEdited: jest.fn(),
  }

  const mailService = {
    sendExternalCommentNotification: jest.fn(),
    sendReportDenied: jest.fn(),
    sendReportApproved: jest.fn(),
    sendReportDeadlineReminder: jest.fn(),
  }

  const reportPdfService = {
    generateReportPdf: jest.fn(),
    generateImprovementPlanPdf: jest.fn(),
  }

  const companyFileService = {
    archive: jest.fn(),
  }

  const reportModel = {
    update: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  }

  const companyReportModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  }

  const companyModel = {
    update: jest.fn(),
  }

  const userModel = {
    findOne: jest.fn(),
  }

  const reportOutlierGroupModel = {
    findOne: jest.fn(),
  }

  let service: ReportWorkflowService

  const reviewerContext = (
    status: ReportStatusEnum,
  ): ReportResourceContext => ({
    reportId: 'report-1',
    reportStatus: status,
    actor: { kind: ReportRoleEnum.REVIEWER, userId: 'reviewer-1' },
  })

  const companyContext = (status: ReportStatusEnum): ReportResourceContext => ({
    reportId: 'report-1',
    reportStatus: status,
    actor: { kind: ReportRoleEnum.COMPANY, nationalId: '5500000000' },
  })

  /*
   * ⚠️ **Re-arm EVERY collaborator whose failure any test simulates.**
   *
   * `jest.preset.js` sets `clearMocks` and `restoreMocks` but NOT `resetMocks`.
   * `clearMocks` clears calls, `restoreMocks` only restores `jest.spyOn` spies —
   * neither drops an implementation set on a plain `jest.fn()`. So a
   * `mockRejectedValue`/`mockImplementation` anywhere in this file persists into
   * every later test, and the suite's result depends on declaration order.
   *
   * `mailService` and `applicationSystemService` were the two that leaked: the
   * deny test that rejects `notifyDenied`, and the approve tests that reject
   * `sendReportApproved` or swap it for an ordering probe. Everything they can
   * fail is reset to its happy value here.
   */
  beforeEach(() => {
    jest.clearAllMocks()
    // A working renderer is the default so the existing approve cases exercise
    // the happy path rather than silently falling into the notification's
    // catch-and-log.
    reportPdfService.generateReportPdf.mockResolvedValue({
      pdf: Buffer.from('pdf-bytes'),
      fileName: 'jafnrettisaaetlun-report-1.pdf',
    })
    // Null is the common case: a compliant company has no plan to attach.
    reportPdfService.generateImprovementPlanPdf.mockResolvedValue(null)
    companyFileService.archive.mockResolvedValue([])
    // `true` is "delivered". A default of `undefined` would read as a failed
    // send and skip the S3 archive in every test that does not set it.
    mailService.sendReportApproved.mockResolvedValue(true)
    mailService.sendReportDenied.mockResolvedValue(undefined)
    mailService.sendExternalCommentNotification.mockResolvedValue(undefined)
    mailService.sendReportDeadlineReminder.mockResolvedValue(undefined)
    applicationSystemService.notifyApproved.mockResolvedValue(undefined)
    applicationSystemService.notifyDenied.mockResolvedValue(undefined)
    applicationSystemService.notifyEdited.mockResolvedValue(undefined)
    service = new ReportWorkflowService(
      logger as never,
      reportEventService as never,
      applicationSystemService as never,
      mailService as never,
      reportPdfService as never,
      companyFileService as never,
      reportModel as never,
      companyReportModel as never,
      companyModel as never,
      userModel as never,
      reportOutlierGroupModel as never,
    )
  })

  describe('assign', () => {
    it('transitions SUBMITTED → IN_REVIEW and assigns the caller when no userId is given', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
      userModel.findOne.mockResolvedValue({
        id: 'reviewer-1',
        isActive: true,
      })
      reportEventService.emitAssigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {})

      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.IN_REVIEW,
          reviewerUserId: 'reviewer-1',
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        'reviewer-1',
        ReportStatusEnum.IN_REVIEW,
      )
      expect(reportEventService.emitStatusChanged).not.toHaveBeenCalled()
    })

    it('assigns a specific active user when userId is supplied', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
      userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: true })
      reportEventService.emitAssigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
        userId: 'user-2',
      })

      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        attributes: ['id', 'isActive'],
      })
      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.IN_REVIEW,
          reviewerUserId: 'user-2',
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        'user-2',
        ReportStatusEnum.IN_REVIEW,
      )
    })

    it('reassigns an IN_REVIEW report to a different user without changing status', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({ reviewerUserId: 'user-1' })
      userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: true })
      reportEventService.emitAssigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        userId: 'user-2',
      })

      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.IN_REVIEW,
          reviewerUserId: 'user-2',
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        'user-2',
        ReportStatusEnum.IN_REVIEW,
      )
    })

    it('unassigns an IN_REVIEW report and returns it to SUBMITTED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({ reviewerUserId: 'user-1' })
      reportEventService.emitUnassigned.mockResolvedValue(undefined)

      await service.assign(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        userId: null,
      })

      expect(userModel.findOne).not.toHaveBeenCalled()
      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.SUBMITTED,
          reviewerUserId: null,
        },
        { where: { id: 'report-1' } },
      )
      expect(reportEventService.emitAssigned).not.toHaveBeenCalled()
      expect(reportEventService.emitUnassigned).toHaveBeenCalledWith(
        'report-1',
        'reviewer-1',
        'user-1',
        ReportStatusEnum.SUBMITTED,
      )
    })

    it('is a no-op when reassigning to the same user with same status', async () => {
      reportModel.findOne.mockResolvedValue({ reviewerUserId: 'reviewer-1' })
      userModel.findOne.mockResolvedValue({
        id: 'reviewer-1',
        isActive: true,
      })

      await service.assign(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        userId: 'reviewer-1',
      })

      expect(reportModel.update).not.toHaveBeenCalled()
      expect(reportEventService.emitAssigned).not.toHaveBeenCalled()
    })

    it('rejects when target user is inactive', async () => {
      reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
      userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: false })

      await expect(
        service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: 'user-2',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects when target user does not exist', async () => {
      reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
      userModel.findOne.mockResolvedValue(null)

      await expect(
        service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: 'missing',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects unassign from SUBMITTED (nothing to unassign)', async () => {
      await expect(
        service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: null,
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects reports outside SUBMITTED / IN_REVIEW', async () => {
      await expect(
        service.assign(reviewerContext(ReportStatusEnum.DRAFT), {}),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects company actors', async () => {
      await expect(
        service.assign(companyContext(ReportStatusEnum.SUBMITTED), {}),
      ).rejects.toBeInstanceOf(ForbiddenException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    describe('updateStatus: false', () => {
      it('assigns a SUBMITTED report without moving it into review', async () => {
        reportModel.update.mockResolvedValue([1])
        reportModel.findOne.mockResolvedValue({ reviewerUserId: null })
        userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: true })
        reportEventService.emitAssigned.mockResolvedValue(undefined)

        await service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: 'user-2',
          updateStatus: false,
        })

        expect(reportModel.update).toHaveBeenCalledWith(
          {
            status: ReportStatusEnum.SUBMITTED,
            reviewerUserId: 'user-2',
          },
          { where: { id: 'report-1' } },
        )
        expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
          'report-1',
          'reviewer-1',
          'user-2',
          ReportStatusEnum.SUBMITTED,
        )
      })

      it('allows unassigning a SUBMITTED report, which is a 400 otherwise', async () => {
        reportModel.update.mockResolvedValue([1])
        reportModel.findOne.mockResolvedValue({ reviewerUserId: 'user-2' })
        reportEventService.emitUnassigned.mockResolvedValue(undefined)

        await service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: null,
          updateStatus: false,
        })

        expect(reportModel.update).toHaveBeenCalledWith(
          {
            status: ReportStatusEnum.SUBMITTED,
            reviewerUserId: null,
          },
          { where: { id: 'report-1' } },
        )
        expect(reportEventService.emitUnassigned).toHaveBeenCalledWith(
          'report-1',
          'reviewer-1',
          'user-2',
          ReportStatusEnum.SUBMITTED,
        )
      })

      it('keeps an IN_REVIEW report in review when the reviewer is cleared', async () => {
        reportModel.update.mockResolvedValue([1])
        reportModel.findOne.mockResolvedValue({ reviewerUserId: 'user-2' })
        reportEventService.emitUnassigned.mockResolvedValue(undefined)

        await service.assign(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          userId: null,
          updateStatus: false,
        })

        expect(reportModel.update).toHaveBeenCalledWith(
          {
            status: ReportStatusEnum.IN_REVIEW,
            reviewerUserId: null,
          },
          { where: { id: 'report-1' } },
        )
      })

      it('reassigns an IN_REVIEW report to a different reviewer', async () => {
        reportModel.update.mockResolvedValue([1])
        reportModel.findOne.mockResolvedValue({ reviewerUserId: 'user-1' })
        userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: true })
        reportEventService.emitAssigned.mockResolvedValue(undefined)

        await service.assign(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          userId: 'user-2',
          updateStatus: false,
        })

        expect(reportModel.update).toHaveBeenCalledWith(
          {
            status: ReportStatusEnum.IN_REVIEW,
            reviewerUserId: 'user-2',
          },
          { where: { id: 'report-1' } },
        )
        expect(reportEventService.emitAssigned).toHaveBeenCalledWith(
          'report-1',
          'reviewer-1',
          'user-2',
          ReportStatusEnum.IN_REVIEW,
        )
      })

      it('still refuses a status outside SUBMITTED / IN_REVIEW', async () => {
        // Explicitly an *active* target, so the rejection can only be the
        // status guard — `jest.clearAllMocks()` keeps implementations, so
        // leaving this unset would resolve off a previous test's mock and the
        // assertion could not tell the two guards apart.
        userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: true })

        await expect(
          service.assign(reviewerContext(ReportStatusEnum.POSTPONED), {
            userId: 'user-2',
            updateStatus: false,
          }),
        ).rejects.toThrow('Cannot assign report with status POSTPONED')

        expect(reportModel.update).not.toHaveBeenCalled()
      })

      it('is still a no-op when the reviewer is unchanged', async () => {
        reportModel.findOne.mockResolvedValue({ reviewerUserId: 'user-2' })
        userModel.findOne.mockResolvedValue({ id: 'user-2', isActive: true })

        await service.assign(reviewerContext(ReportStatusEnum.SUBMITTED), {
          userId: 'user-2',
          updateStatus: false,
        })

        expect(reportModel.update).not.toHaveBeenCalled()
        expect(reportEventService.emitAssigned).not.toHaveBeenCalled()
      })
    })
  })

  describe('deny', () => {
    it('transitions IN_REVIEW → DENIED with denial reason and emits STATUS_CHANGED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)

      const dto: DenyReportDto = { denialReason: '  Missing data  ' }
      await service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), dto)

      /*
       * The guard makes the transition atomic: an approve racing this deny can no
       * longer leave the row DENIED while the company holds an approval PDF.
       *
       * ⚠️ It pins `context.reportStatus` — the ONE value the audit event below
       * reports as the prior state — not `IN_REVIEW OR POSTPONED`. A CAS matching
       * either could succeed against the value the context did not hold and
       * record a transition that never happened.
       */
      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.DENIED,
          reviewerUserId: 'reviewer-1',
        },
        {
          where: {
            id: 'report-1',
            status: ReportStatusEnum.IN_REVIEW,
          },
        },
      )
      expect(reportEventService.emitStatusChanged).toHaveBeenCalledWith(
        'report-1',
        ReportStatusEnum.IN_REVIEW,
        ReportStatusEnum.DENIED,
        'reviewer-1',
        'Missing data',
      )
    })

    it('transitions POSTPONED → DENIED and emits STATUS_CHANGED with POSTPONED as from-status', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)

      await service.deny(reviewerContext(ReportStatusEnum.POSTPONED), {
        denialReason: 'Outliers never resolved',
      })

      // Same CAS, pinned to the other deniable status — which is the point: the
      // guard follows what the context read, so the audit event cannot disagree
      // with the row it changed.
      expect(reportModel.update).toHaveBeenCalledWith(
        {
          status: ReportStatusEnum.DENIED,
          reviewerUserId: 'reviewer-1',
        },
        {
          where: {
            id: 'report-1',
            status: ReportStatusEnum.POSTPONED,
          },
        },
      )
      expect(reportEventService.emitStatusChanged).toHaveBeenCalledWith(
        'report-1',
        ReportStatusEnum.POSTPONED,
        ReportStatusEnum.DENIED,
        'reviewer-1',
        'Outliers never resolved',
      )
    })

    it('mails the company the trimmed denial reason', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      const report = {
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        contactEmail: 'contact@example.is',
        companyAdminEmail: null,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.DENIED,
      }
      reportModel.findOne.mockResolvedValue(report)

      await service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        denialReason: '  Vantar gögn  ',
      })

      expect(mailService.sendReportDenied).toHaveBeenCalledWith(
        report,
        'Vantar gögn',
      )
    })

    // The denial is committed and event-logged before the mail runs, so a
    // failure to even load the row must not surface to the reviewer.
    it('still denies when the report cannot be loaded for the notification', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      reportModel.findOne.mockResolvedValue(null)

      await expect(
        service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: 'reason',
        }),
      ).resolves.toBeUndefined()

      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      expect(reportEventService.emitStatusChanged).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalled()
    })

    /*
     * ⚠️ The failing-COMMIT case, which is the only way an after-commit hook can
     * run over work that is not in the database. Sequelize awaits these hooks in
     * `commit()`'s `finally`, so a COMMIT that throws fires them on its way to
     * the rethrow — and the row still reads its pre-transaction status.
     *
     * Delete `decisionLanded`'s guard and this test fails by mailing the company
     * a denial the database never recorded.
     */
    it('tells nobody when the row does not actually say DENIED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      reportModel.findOne.mockResolvedValue({
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        contactEmail: 'contact@example.is',
        // What a rolled-back denial leaves behind.
        status: ReportStatusEnum.IN_REVIEW,
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: 'app-uuid-1',
      })

      await service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        denialReason: 'reason',
      })

      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      expect(applicationSystemService.notifyDenied).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalled()
    })

    it('still denies when the notification load throws', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      // The FIRST read is now `decisionLanded`'s status check, which fails
      // closed and catches its own error — `runAfterCommit` runs the callback
      // bare when there is no ambient transaction, so an uncaught read here
      // would surface to the reviewer.
      reportModel.findOne
        .mockRejectedValueOnce(new Error('db is down'))
        .mockResolvedValue(null)

      await expect(
        service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: 'reason',
        }),
      ).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalled()
    })

    it('notifies the application system when the report is island.is-sourced', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.DENIED,
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: 'app-uuid-1',
      })

      await service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        denialReason: 'reason',
      })

      expect(applicationSystemService.notifyDenied).toHaveBeenCalledWith(
        'app-uuid-1',
      )
    })

    // Silent from any prior state — the STATUS_CHANGED event for the denial is
    // the audit record of why the thread closed.
    it('closes the communication thread without a separate audit event', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)

      await service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        denialReason: 'reason',
      })

      expect(reportModel.update).toHaveBeenCalledWith(
        { communicationStatus: CommunicationStatusEnum.CLOSED },
        { where: { id: 'report-1' } },
      )
    })

    it('does not notify the application system for non-island.is reports', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.DENIED,
        providerType: ReportProviderEnum.SYSTEM,
        providerId: null,
      })

      await service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
        denialReason: 'reason',
      })

      expect(applicationSystemService.notifyDenied).not.toHaveBeenCalled()
    })

    it('does not fail the denial when the application system notification throws', async () => {
      reportModel.update.mockResolvedValue([1])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.DENIED,
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: 'app-uuid-1',
      })
      applicationSystemService.notifyDenied.mockRejectedValue(new Error('boom'))

      await expect(
        service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: 'reason',
        }),
      ).resolves.toBeUndefined()
    })

    it('rejects reports outside IN_REVIEW / POSTPONED', async () => {
      for (const status of [
        ReportStatusEnum.SUBMITTED,
        ReportStatusEnum.DRAFT,
        ReportStatusEnum.APPROVED,
        ReportStatusEnum.DENIED,
      ]) {
        await expect(
          service.deny(reviewerContext(status), {
            denialReason: 'reason',
          }),
        ).rejects.toBeInstanceOf(BadRequestException)
      }

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects blank denial reason', async () => {
      await expect(
        service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: '   ',
        }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects company actors', async () => {
      await expect(
        service.deny(companyContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: 'reason',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('approve', () => {
    it('transitions IN_REVIEW → APPROVED, supersedes prior approvals of the same type, emits STATUS_CHANGED + SUPERSEDED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        type: ReportTypeEnum.SALARY,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      })
      reportModel.findAll.mockResolvedValue([{ id: 'old-report-1' }])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      reportEventService.emitSuperseded.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([
        { reportId: 'old-report-1' },
        { reportId: 'report-1' },
      ])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      // The status guard is the point: it is what makes a concurrent second
      // approval a no-op rather than a second email with attachments.
      expect(reportModel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReportStatusEnum.APPROVED,
          reviewerUserId: 'reviewer-1',
        }),
        {
          where: {
            id: 'report-1',
            status: ReportStatusEnum.IN_REVIEW,
          },
        },
      )
      expect(reportModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ReportStatusEnum.APPROVED,
            type: ReportTypeEnum.SALARY,
          }),
        }),
      )
      expect(reportModel.update).toHaveBeenCalledWith(
        { status: ReportStatusEnum.SUPERSEDED, validUntil: expect.any(Date) },
        { where: { id: ['old-report-1'] } },
      )
      expect(reportEventService.emitSuperseded).toHaveBeenCalledWith(
        'old-report-1',
        'report-1',
      )
      expect(reportEventService.emitStatusChanged).toHaveBeenCalledWith(
        'report-1',
        ReportStatusEnum.IN_REVIEW,
        ReportStatusEnum.APPROVED,
        'reviewer-1',
      )
    })

    it('mails the company the report PDF on an EQUALITY approval', async () => {
      reportModel.update.mockResolvedValue([1])
      const report = {
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        validUntil: new Date('2029-08-31'),
        contactEmail: 'contact@example.is',
        companyAdminEmail: null,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      }
      reportModel.findOne.mockResolvedValue(report)
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(reportPdfService.generateReportPdf).toHaveBeenCalledWith('report-1')
      expect(mailService.sendReportApproved).toHaveBeenCalledWith(report, [
        {
          filename: 'jafnrettisaaetlun-report-1.pdf',
          content: Buffer.from('pdf-bytes'),
          label: 'jafnréttisáætlun',
        },
      ])
    })

    it('attaches the úrbótaáætlun as a second document on a SALARY approval', async () => {
      reportModel.update.mockResolvedValue([1])
      const report = {
        id: 'report-1',
        type: ReportTypeEnum.SALARY,
        validUntil: new Date('2029-08-31'),
        contactEmail: 'contact@example.is',
        companyAdminEmail: null,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      }
      reportModel.findOne.mockResolvedValue(report)
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])
      reportPdfService.generateReportPdf.mockResolvedValue({
        pdf: Buffer.from('report-bytes'),
        fileName: 'launagreining-report-1.pdf',
      })
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue({
        pdf: Buffer.from('plan-bytes'),
        fileName: 'urbotaaetlun-report-1.pdf',
      })

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(mailService.sendReportApproved).toHaveBeenCalledWith(report, [
        {
          filename: 'launagreining-report-1.pdf',
          content: Buffer.from('report-bytes'),
          label: 'jafnlaunaúttekt',
        },
        {
          filename: 'urbotaaetlun-report-1.pdf',
          content: Buffer.from('plan-bytes'),
          label: 'úrbótaáætlun',
        },
      ])
    })

    /**
     * ⚠️ The compare-and-swap is what stops a concurrent or retried approve from
     * mailing the company a second set of attachments and writing a second S3
     * object. Before it, the status check read a value resolved earlier in the
     * request and the write was keyed on `id` alone.
     */
    it('rejects and does nothing further when the status guard matches no row', async () => {
      reportModel.update.mockResolvedValue([0])
      reportModel.findAll.mockResolvedValue([])

      // ⚠️ Rejects rather than returning 2xx. A silent success would tell the
      // reviewer their approval landed on a report that moved under them.
      await expect(
        service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW)),
      ).rejects.toThrow(/no longer IN_REVIEW/)

      expect(reportEventService.emitStatusChanged).not.toHaveBeenCalled()
      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      expect(companyFileService.archive).not.toHaveBeenCalled()
      expect(companyModel.update).not.toHaveBeenCalled()
    })

    it('rejects a deny whose status guard matches no row', async () => {
      reportModel.update.mockResolvedValue([0])

      await expect(
        service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: 'reason',
        }),
      ).rejects.toThrow(/no longer awaiting a decision/)

      expect(reportEventService.emitStatusChanged).not.toHaveBeenCalled()
      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
    })

    it('archives every attachment under the company national id', async () => {
      // Deliberately 23:55 UTC: if the key ever went back to `new Date()` at
      // archive time — after up to two renders — this would file under the next
      // day, and the reconstructible-key argument that excuses having no
      // `s3_key` column would break silently.
      const approvedAt = new Date('2026-08-31T23:55:00.000Z')
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
        id: 'report-1',
        type: ReportTypeEnum.SALARY,
        companyNationalId: '5500000000',
        contactEmail: 'contact@example.is',
        approvedAt,
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])
      reportPdfService.generateReportPdf.mockResolvedValue({
        pdf: Buffer.from('report-bytes'),
        fileName: 'launagreining-report-1.pdf',
      })
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue({
        pdf: Buffer.from('plan-bytes'),
        fileName: 'urbotaaetlun-report-1.pdf',
      })

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(companyFileService.archive).toHaveBeenCalledWith([
        expect.objectContaining({
          companyNationalId: '5500000000',
          filename: 'launagreining-report-1.pdf',
          content: Buffer.from('report-bytes'),
          issuedAt: approvedAt,
        }),
        expect.objectContaining({
          companyNationalId: '5500000000',
          filename: 'urbotaaetlun-report-1.pdf',
          content: Buffer.from('plan-bytes'),
          issuedAt: approvedAt,
        }),
      ])
    })

    /**
     * ⚠️ Archiving runs AFTER the send. Uploading first would let an unset or
     * misconfigured bucket stop the notification — the exact failure to avoid
     * while the bucket is still being provisioned.
     */
    it('sends the mail before archiving', async () => {
      const order: string[] = []
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        companyNationalId: '5500000000',
        contactEmail: 'contact@example.is',
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])
      mailService.sendReportApproved.mockImplementation(async () => {
        order.push('mail')
        return true
      })
      companyFileService.archive.mockImplementation(async () => {
        order.push('archive')
        return []
      })

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(order).toEqual(['mail', 'archive'])
    })

    // The prefix IS the retrieval path, so a document filed without a national
    // id is one nobody will find.
    /*
     * ⚠️ `archiveApprovalDocuments` documents itself as the Directorate's copy of
     * what the company RECEIVED, so writing it after a failed send puts a false
     * yes where someone will later look for proof of delivery. `sendReportApproved`
     * returns the outcome for exactly this.
     */
    it('does not archive when the mail did not go out', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        status: ReportStatusEnum.APPROVED,
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        companyNationalId: '5500000000',
        contactEmail: 'contact@example.is',
        approvedAt: new Date('2026-08-31T10:00:00.000Z'),
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])
      mailService.sendReportApproved.mockResolvedValue(false)

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(mailService.sendReportApproved).toHaveBeenCalled()
      expect(companyFileService.archive).not.toHaveBeenCalled()
    })

    it('skips archiving and warns when the report has no companyNationalId', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        companyNationalId: null,
        contactEmail: 'contact@example.is',
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(companyFileService.archive).not.toHaveBeenCalled()
      expect(mailService.sendReportApproved).toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalled()
    })

    /**
     * ⚠️ A failing plan render must not cost the company its report. It used to:
     * the throw propagated past `sendReportApproved`, so an approval whose report
     * PDF rendered perfectly sent nothing at all.
     */
    it('mails the report alone when the úrbótaáætlun render throws', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
        id: 'report-1',
        type: ReportTypeEnum.SALARY,
        companyNationalId: '5500000000',
        contactEmail: 'contact@example.is',
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])
      reportPdfService.generateReportPdf.mockResolvedValue({
        pdf: Buffer.from('report-bytes'),
        fileName: 'launagreining-report-1.pdf',
      })
      reportPdfService.generateImprovementPlanPdf.mockRejectedValue(
        new Error('chromium died'),
      )

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(mailService.sendReportApproved).toHaveBeenCalledTimes(1)
      const [, attachments] = mailService.sendReportApproved.mock.calls[0]
      expect(attachments).toHaveLength(1)
      expect(attachments[0].label).toBe('jafnlaunaúttekt')
      expect(logger.error).toHaveBeenCalled()
    })

    // A compliant company has no plan; the salary report carries that finding.
    it('sends only the report when there is no úrbótaáætlun', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
        id: 'report-1',
        type: ReportTypeEnum.SALARY,
        contactEmail: 'contact@example.is',
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue(null)

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      const [, attachments] = mailService.sendReportApproved.mock.calls[0]
      expect(attachments).toHaveLength(1)
    })

    // An equality report has no outlier groups, so the plan must not be asked
    // for at all.
    it('does not ask for an úrbótaáætlun on an EQUALITY approval', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        contactEmail: 'contact@example.is',
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(
        reportPdfService.generateImprovementPlanPdf,
      ).not.toHaveBeenCalled()
    })

    /*
     * The approval, the due-date advance, the supersede and the audit event are
     * all committed before the notification runs.
     *
     * ⚠️ And the NOTICE STILL GOES, without the attachment. The report render
     * used to be the one unguarded one, so a Chromium failure propagated into
     * `notifyCompanyApproved`'s catch and the company heard nothing at all about
     * an approval that was already durable. The notice is the part that cannot be
     * reconstructed later; the PDF can be downloaded from the report screen.
     */
    it('still approves and still notifies when the PDF cannot be rendered', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        contactEmail: 'contact@example.is',
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])
      reportPdfService.generateReportPdf.mockRejectedValue(
        new Error('chromium is missing'),
      )

      await expect(
        service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW)),
      ).resolves.toBeUndefined()

      expect(mailService.sendReportApproved).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'report-1' }),
        [],
      )
      // And nothing is archived, because nothing was produced to archive.
      expect(companyFileService.archive).not.toHaveBeenCalled()
      expect(reportEventService.emitStatusChanged).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalled()
    })

    it('advances the parent company next_salary_report_due_at to the new validUntil on a SALARY approval', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        type: ReportTypeEnum.SALARY,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(companyModel.update).toHaveBeenCalledWith(
        { nextSalaryReportDueAt: expect.any(Date) },
        { where: { id: 'company-1' } },
      )
    })

    it('advances next_equality_report_due_at (not salary) on an EQUALITY approval', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        type: ReportTypeEnum.EQUALITY,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(companyModel.update).toHaveBeenCalledWith(
        { nextEqualityReportDueAt: expect.any(Date) },
        { where: { id: 'company-1' } },
      )
    })

    it('does not supersede approved reports of a different type (SALARY approval leaves APPROVED EQUALITY untouched)', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        type: ReportTypeEnum.SALARY,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      })
      // The cross-type EQUALITY sibling exists in company_report but the
      // type-scoped findAll filters it out, returning no rows to supersede.
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([
        { reportId: 'old-equality-1' },
        { reportId: 'report-1' },
      ])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(reportModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: ['old-equality-1'],
            status: ReportStatusEnum.APPROVED,
            type: ReportTypeEnum.SALARY,
          }),
        }),
      )
      // Only the APPROVED transition and the communication close ran — no
      // supersede update, no SUPERSEDED event for the EQUALITY sibling.
      expect(reportModel.update).toHaveBeenCalledTimes(2)
      expect(reportEventService.emitSuperseded).not.toHaveBeenCalled()
    })

    it('skips supersede when no sibling reports are APPROVED', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        type: ReportTypeEnum.EQUALITY,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      // APPROVED transition + communication close, nothing else.
      expect(reportModel.update).toHaveBeenCalledTimes(2)
      expect(reportEventService.emitSuperseded).not.toHaveBeenCalled()
    })

    it('notifies the application system on approval of an island.is report', async () => {
      reportOutlierGroupModel.findOne.mockResolvedValue(null)
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne
        // advance-due-date type lookup
        .mockResolvedValueOnce({ type: ReportTypeEnum.EQUALITY })
        // supersede type lookup
        .mockResolvedValueOnce({ type: ReportTypeEnum.EQUALITY })
        // the after-commit gate's status read
        .mockResolvedValueOnce({ status: ReportStatusEnum.APPROVED })
        // company-notification lookup
        .mockResolvedValueOnce({
          id: 'report-1',
          type: ReportTypeEnum.EQUALITY,
          contactEmail: 'contact@example.is',
        })
        // notify provider lookup
        .mockResolvedValueOnce({
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: 'app-uuid-1',
        })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      expect(applicationSystemService.notifyApproved).toHaveBeenCalledWith(
        'app-uuid-1',
      )
    })

    it('rejects non-IN_REVIEW reports', async () => {
      await expect(
        service.approve(reviewerContext(ReportStatusEnum.SUBMITTED)),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportModel.update).not.toHaveBeenCalled()
    })

    it('rejects company actors', async () => {
      await expect(
        service.approve(companyContext(ReportStatusEnum.IN_REVIEW)),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('rejects when any outlier group on the report still has a null explanation', async () => {
      reportOutlierGroupModel.findOne.mockResolvedValueOnce({
        id: 'group-1',
      })

      await expect(
        service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW)),
      ).rejects.toBeInstanceOf(BadRequestException)

      // The gate fires before the APPROVED update.
      expect(reportModel.update).not.toHaveBeenCalled()
      expect(reportEventService.emitStatusChanged).not.toHaveBeenCalled()
    })

    it('proceeds with approval when no outlier group has a missing explanation (EQUALITY no-op or SALARY resolved)', async () => {
      reportOutlierGroupModel.findOne.mockResolvedValueOnce(null)
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        type: ReportTypeEnum.EQUALITY,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])

      await service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW))

      // Gate ran first, then the APPROVED update.
      expect(reportOutlierGroupModel.findOne).toHaveBeenCalledTimes(1)
      expect(reportModel.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatusEnum.APPROVED }),
        {
          where: {
            id: 'report-1',
            status: ReportStatusEnum.IN_REVIEW,
          },
        },
      )
    })
  })

  /**
   * The outbound work must not happen until the request's transaction has
   * actually committed. Everything else in this spec runs with no ambient
   * transaction and therefore takes `runAfterCommit`'s inline path, which is
   * what keeps those cases meaningful — this block is the only one that
   * exercises the deferral.
   */
  describe('after-commit deferral', () => {
    /** Stands in for the transaction `CLSMiddleware` puts in the CLS namespace. */
    const makeFakeTransaction = () => {
      const hooks: (() => Promise<void>)[] = []
      return {
        transaction: { afterCommit: (fn: () => Promise<void>) => hooks.push(fn) },
        /** What `Transaction.commit` does once the COMMIT has landed. */
        commit: async () => {
          for (const hook of hooks) await hook()
        },
        hookCount: () => hooks.length,
      }
    }

    const withAmbientTransaction = async (
      fake: ReturnType<typeof makeFakeTransaction>,
      run: () => Promise<void>,
    ) => {
      const ns = createNamespace(CLS_NAMESPACE)
      try {
        await new Promise<void>((resolve, reject) => {
          ns.run(() => {
            ns.set('transaction', fake.transaction)
            run().then(resolve, reject)
          })
        })
      } finally {
        destroyNamespace(CLS_NAMESPACE)
      }
    }

    const seedApprovableReport = () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        companyNationalId: '5500000000',
        contactEmail: 'contact@example.is',
        providerType: ReportProviderEnum.SYSTEM,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.APPROVED,
      })
      reportModel.findAll.mockResolvedValue([])
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      companyReportModel.findOne.mockResolvedValue({ companyId: 'company-1' })
      companyReportModel.findAll.mockResolvedValue([{ reportId: 'report-1' }])
    }

    it('does not mail on approve until the transaction commits', async () => {
      seedApprovableReport()
      const fake = makeFakeTransaction()

      await withAmbientTransaction(fake, () =>
        service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW)),
      )

      // The status write and the audit event have happened; the irrevocable part
      // has not.
      expect(reportEventService.emitStatusChanged).toHaveBeenCalled()
      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      expect(reportPdfService.generateReportPdf).not.toHaveBeenCalled()
      expect(fake.hookCount()).toBe(1)

      await fake.commit()

      expect(mailService.sendReportApproved).toHaveBeenCalledTimes(1)
    })

    it('does not mail on deny until the transaction commits', async () => {
      reportModel.update.mockResolvedValue([1])
      reportModel.findOne.mockResolvedValue({
        id: 'report-1',
        type: ReportTypeEnum.SALARY,
        contactEmail: 'contact@example.is',
        providerType: ReportProviderEnum.SYSTEM,
        // The after-commit gate re-reads `status` to confirm the commit landed.
        status: ReportStatusEnum.DENIED,
      })
      reportEventService.emitStatusChanged.mockResolvedValue(undefined)
      const fake = makeFakeTransaction()

      await withAmbientTransaction(fake, () =>
        service.deny(reviewerContext(ReportStatusEnum.IN_REVIEW), {
          denialReason: 'Vantar gögn',
        }),
      )

      expect(mailService.sendReportDenied).not.toHaveBeenCalled()

      await fake.commit()

      expect(mailService.sendReportDenied).toHaveBeenCalledWith(
        expect.anything(),
        'Vantar gögn',
      )
    })

    /**
     * ⚠️ Load-bearing. Sequelize awaits these hooks inside `commit()`'s
     * `finally`, and `CLSMiddleware` calls `commit()` from an un-awaited
     * `res.on('finish')` callback — so a rejection escaping the hook becomes an
     * unhandled rejection with no request left to fail.
     */
    // A mail failure is caught by `notifyCompanyApproved` itself, a layer BELOW
    // the hook — so this covers that path, not `runAfterCommit`'s catch-all. The
    // test after it covers the catch-all.
    it('survives a mail failure inside the deferred work', async () => {
      seedApprovableReport()
      mailService.sendReportApproved.mockRejectedValue(
        new Error('everything is on fire'),
      )
      const fake = makeFakeTransaction()

      await withAmbientTransaction(fake, () =>
        service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW)),
      )

      await expect(fake.commit()).resolves.toBeUndefined()
      expect(logger.error).toHaveBeenCalled()
    })

    /**
     * ⚠️ Exercises `runAfterCommit`'s catch-all directly, which is the only way
     * to reach it: every call inside the real work is already total, so throwing
     * from `sendReportApproved` is swallowed a layer down — the previous version
     * of this test passed with the catch deleted.
     *
     * The catch is load-bearing. Sequelize awaits these hooks inside `commit()`,
     * which `CLSMiddleware` calls from an un-awaited `res.on('finish')`, so a
     * rejection escaping it becomes an unhandled rejection with no request left
     * to fail.
     */
    it('swallows a throw from the deferred work itself', async () => {
      const fake = makeFakeTransaction()
      const boom = jest.fn(async () => {
        throw new Error('detached failure')
      })

      const withPrivate = service as unknown as {
        runAfterCommit: (
          label: string,
          work: () => Promise<void>,
        ) => Promise<void>
      }

      await withAmbientTransaction(fake, () =>
        withPrivate.runAfterCommit('test work', boom),
      )

      await expect(fake.commit()).resolves.toBeUndefined()
      expect(boom).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Post-commit test work failed'),
        expect.anything(),
      )
    })

    // A rolled-back transaction never runs its after-commit hooks, so a denial
    // that did not persist cannot have told the company it did.
    it('sends nothing if the transaction never commits', async () => {
      seedApprovableReport()
      const fake = makeFakeTransaction()

      await withAmbientTransaction(fake, () =>
        service.approve(reviewerContext(ReportStatusEnum.IN_REVIEW)),
      )

      // No commit() — this is the rollback path.
      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      expect(companyFileService.archive).not.toHaveBeenCalled()
      expect(applicationSystemService.notifyApproved).not.toHaveBeenCalled()
    })
  })
})
