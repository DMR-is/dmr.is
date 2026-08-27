import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ReportModel } from '../../report/models/report.model'
import { IReportDraftAnalysisService } from '../analysis/report-draft-analysis.service.interface'
import { IReportDraftAssignmentService } from '../assignment/report-draft-assignment.service.interface'
import { IReportDraftCriterionService } from '../criterion/report-draft-criterion.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { IReportDraftEmployeeService } from '../employee/report-draft-employee.service.interface'
import { IReportDraftOutlierGroupService } from '../outlier-group/report-draft-outlier-group.service.interface'
import { IReportDraftRoleService } from '../role/report-draft-role.service.interface'
import { IReportDraftStepService } from '../step/report-draft-step.service.interface'
import { IReportDraftSubCriterionService } from '../sub-criterion/report-draft-sub-criterion.service.interface'
import { ReportDraftSyncService } from './report-draft-sync.service'
import { SyncMethodEnum } from './sync-method.enum'

const COMPANY = { nationalId: '1234567890' } as never
const REPORT = { id: 'report-1' } as ReportModel

describe('ReportDraftSyncService', () => {
  let service: ReportDraftSyncService
  let reportDraft: { findOwnedDraft: jest.Mock; touchDraft: jest.Mock }
  let analysis: { getDetectedOutlierEmployeeIds: jest.Mock }
  let criterion: Record<string, jest.Mock>
  let subCriterion: Record<string, jest.Mock>
  let step: Record<string, jest.Mock>
  let role: Record<string, jest.Mock>
  let employee: Record<string, jest.Mock>
  let assignment: Record<string, jest.Mock>
  let outlierGroup: Record<string, jest.Mock>

  beforeEach(async () => {
    reportDraft = {
      findOwnedDraft: jest.fn().mockResolvedValue(REPORT),
      touchDraft: jest.fn().mockResolvedValue(undefined),
    }
    analysis = {
      getDetectedOutlierEmployeeIds: jest
        .fn()
        .mockResolvedValue(new Set<string>()),
    }
    criterion = {
      createCriterion: jest.fn(),
      updateCriterion: jest.fn(),
      removeCriterion: jest.fn(),
    }
    subCriterion = {
      createSubCriterion: jest.fn(),
      updateSubCriterion: jest.fn(),
      removeSubCriterion: jest.fn(),
    }
    step = {
      createStep: jest.fn(),
      updateStep: jest.fn(),
      removeStep: jest.fn(),
    }
    role = {
      createRole: jest.fn(),
      updateRole: jest.fn(),
      removeRole: jest.fn(),
    }
    employee = {
      getMaxOrdinal: jest.fn().mockResolvedValue(0),
      createEmployee: jest.fn(),
      updateEmployee: jest.fn(),
      removeEmployee: jest.fn(),
    }
    assignment = {
      setRoleSteps: jest.fn(),
      setEmployeeSteps: jest.fn(),
    }
    outlierGroup = {
      createGroup: jest.fn(),
      updateGroup: jest.fn(),
      removeGroup: jest.fn(),
      setEmployeeGroup: jest.fn().mockResolvedValue(true),
      clearEmployeeGroup: jest.fn(),
      clearEmployeeGroups: jest.fn(),
      getMemberEmployeeIds: jest.fn().mockResolvedValue([]),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportDraftSyncService,
        { provide: LOGGER_PROVIDER, useValue: { info: jest.fn() } },
        { provide: IReportDraftService, useValue: reportDraft },
        { provide: IReportDraftAnalysisService, useValue: analysis },
        { provide: IReportDraftCriterionService, useValue: criterion },
        { provide: IReportDraftSubCriterionService, useValue: subCriterion },
        { provide: IReportDraftStepService, useValue: step },
        { provide: IReportDraftRoleService, useValue: role },
        { provide: IReportDraftEmployeeService, useValue: employee },
        { provide: IReportDraftAssignmentService, useValue: assignment },
        { provide: IReportDraftOutlierGroupService, useValue: outlierGroup },
      ],
    }).compile()

    service = module.get(ReportDraftSyncService)
  })

  it('resolves and owns the draft once', async () => {
    await service.syncDraft('prov-1', COMPANY, {})
    expect(reportDraft.findOwnedDraft).toHaveBeenCalledTimes(1)
    expect(reportDraft.findOwnedDraft).toHaveBeenCalledWith('prov-1', COMPANY)
  })

  it('applies creates/updates through the appliers with the resolved report', async () => {
    await service.syncDraft('prov-1', COMPANY, {
      criteria: [
        { method: SyncMethodEnum.CREATE, id: 'c1', data: { title: 'A' } },
      ],
      roles: [{ method: SyncMethodEnum.CREATE, id: 'r1', data: { title: 'R' } }],
    })
    expect(criterion.createCriterion).toHaveBeenCalledWith(REPORT, 'c1', {
      title: 'A',
    })
    expect(role.createRole).toHaveBeenCalledWith(REPORT, 'r1', { title: 'R' })
  })

  it('hands out incrementing ordinals from the current max for employee creates', async () => {
    employee.getMaxOrdinal.mockResolvedValue(5)
    await service.syncDraft('prov-1', COMPANY, {
      employees: [
        { method: SyncMethodEnum.CREATE, id: 'e1', data: {} },
        { method: SyncMethodEnum.CREATE, id: 'e2', data: {} },
      ],
    })
    expect(employee.createEmployee).toHaveBeenNthCalledWith(1, REPORT, 'e1', {}, 6)
    expect(employee.createEmployee).toHaveBeenNthCalledWith(2, REPORT, 'e2', {}, 7)
  })

  it('applies folded step assignments after the entity rows', async () => {
    await service.syncDraft('prov-1', COMPANY, {
      roles: [
        {
          method: SyncMethodEnum.CREATE,
          id: 'r1',
          data: { title: 'R', stepIds: ['s1'] },
        },
      ],
      employees: [
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e1',
          data: { stepIds: ['s1', 's2'] },
        },
      ],
    })
    expect(assignment.setRoleSteps).toHaveBeenCalledWith(REPORT, 'r1', ['s1'])
    expect(assignment.setEmployeeSteps).toHaveBeenCalledWith(REPORT, 'e1', [
      's1',
      's2',
    ])
  })

  it('clears membership before removals and sets it after outlier detection', async () => {
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set(['e2']))
    await service.syncDraft('prov-1', COMPANY, {
      employees: [
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e1',
          data: { outlierGroupId: null },
        },
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e2',
          data: { outlierGroupId: 'g1' },
        },
      ],
    })
    expect(outlierGroup.clearEmployeeGroup).toHaveBeenCalledWith(REPORT, 'e1')
    expect(analysis.getDetectedOutlierEmployeeIds).toHaveBeenCalledWith(
      'report-1',
    )
    expect(outlierGroup.setEmployeeGroup).toHaveBeenCalledWith(
      REPORT,
      'e2',
      'g1',
      new Set(['e2']),
    )
  })

  it('does not derive outliers when nothing needs them', async () => {
    await service.syncDraft('prov-1', COMPANY, {
      employees: [{ method: SyncMethodEnum.CREATE, id: 'e1', data: {} }],
    })
    expect(analysis.getDetectedOutlierEmployeeIds).not.toHaveBeenCalled()
  })

  // The whole point of re-deriving here: edits can push an employee out of the
  // lágmarksmengi, and submit rejects a membership for a non-outlier, so the
  // row has to go with them.
  it('drops memberships of employees the recalculation cleared', async () => {
    outlierGroup.getMemberEmployeeIds.mockResolvedValue(['e1', 'e2'])
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set(['e2']))

    await service.syncDraft('prov-1', COMPANY, {
      outlierGroups: [
        { method: SyncMethodEnum.UPDATE, id: 'g1', data: { name: 'A' } },
      ],
    })

    expect(outlierGroup.clearEmployeeGroups).toHaveBeenCalledWith(REPORT, ['e1'])
  })

  it('keeps memberships of employees that are still outliers', async () => {
    outlierGroup.getMemberEmployeeIds.mockResolvedValue(['e1'])
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set(['e1']))

    await service.syncDraft('prov-1', COMPANY, {
      employees: [
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e1',
          data: { outlierGroupId: 'g1' },
        },
      ],
    })

    expect(outlierGroup.clearEmployeeGroups).not.toHaveBeenCalled()
  })

  // The prune is an irreversible delete and membership is a property of the
  // SET, so a batch that is still rewriting the population — one chunk of a
  // >1000-command edit — must not evict employees it never touched.
  it('does not prune on a batch that moved a scoring input', async () => {
    outlierGroup.getMemberEmployeeIds.mockResolvedValue(['e1'])
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set<string>())

    await service.syncDraft('prov-1', COMPANY, {
      employees: [
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e1',
          data: { baseSalary: 900000 },
        },
      ],
    })

    expect(outlierGroup.getMemberEmployeeIds).not.toHaveBeenCalled()
    expect(outlierGroup.clearEmployeeGroups).not.toHaveBeenCalled()
  })

  it.each([
    ['an employee create', { employees: [{ method: SyncMethodEnum.CREATE, id: 'e9', data: {} }] }],
    ['an employee remove', { employees: [{ method: SyncMethodEnum.REMOVE, id: 'e9' }] }],
    ['a step edit', { steps: [{ method: SyncMethodEnum.UPDATE, id: 's1', data: { score: 5 } }] }],
    ['a role edit', { roles: [{ method: SyncMethodEnum.UPDATE, id: 'r1', data: { title: 'R' } }] }],
    [
      'a personal step assignment',
      {
        employees: [
          {
            method: SyncMethodEnum.UPDATE,
            id: 'e1',
            data: { stepIds: ['s1'], outlierGroupId: 'g1' },
          },
        ],
      },
    ],
  ])('does not prune on a batch carrying %s', async (_label, input) => {
    outlierGroup.getMemberEmployeeIds.mockResolvedValue(['e1'])
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set<string>())

    await service.syncDraft('prov-1', COMPANY, input)

    expect(outlierGroup.clearEmployeeGroups).not.toHaveBeenCalled()
  })

  // Stale client state, not a client error — 400ing would roll back the very
  // edits that made the employee a non-outlier.
  it('commits the batch when a membership set is no longer applicable', async () => {
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set(['e2']))
    outlierGroup.setEmployeeGroup.mockImplementation(
      async (_report: unknown, employeeId: string) => employeeId === 'e2',
    )

    await service.syncDraft('prov-1', COMPANY, {
      employees: [
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e1',
          data: { outlierGroupId: 'g1' },
        },
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e2',
          data: { outlierGroupId: 'g1' },
        },
      ],
    })

    // Both go to the applier — it owns the 404s on an unknown employee or
    // group, and reports the non-outlier rather than throwing.
    expect(outlierGroup.setEmployeeGroup).toHaveBeenCalledTimes(2)
    expect(reportDraft.touchDraft).toHaveBeenCalledWith('report-1')
  })

  it('propagates a 404 from a membership set', async () => {
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set(['e1']))
    outlierGroup.setEmployeeGroup.mockRejectedValue(
      new NotFoundException('Employee "ghost" not found'),
    )

    await expect(
      service.syncDraft('prov-1', COMPANY, {
        employees: [
          {
            method: SyncMethodEnum.UPDATE,
            id: 'ghost',
            data: { outlierGroupId: 'g1' },
          },
        ],
      }),
    ).rejects.toThrow(NotFoundException)
    expect(reportDraft.touchDraft).not.toHaveBeenCalled()
  })

  // removeGroup refuses to orphan members, so a group only reads as empty
  // after the prune and after the batch's own sets moved its members out.
  it('removes outlier groups after the prune and the sets', async () => {
    outlierGroup.getMemberEmployeeIds.mockResolvedValue(['e1'])
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set(['e2']))
    const order: string[] = []
    outlierGroup.clearEmployeeGroups.mockImplementation(() => {
      order.push('clear')
    })
    outlierGroup.setEmployeeGroup.mockImplementation(() => {
      order.push('set')
      return true
    })
    outlierGroup.removeGroup.mockImplementation(() => {
      order.push('remove')
    })

    await service.syncDraft('prov-1', COMPANY, {
      employees: [
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e2',
          data: { outlierGroupId: 'g2' },
        },
      ],
      outlierGroups: [{ method: SyncMethodEnum.REMOVE, id: 'g1' }],
    })

    expect(order).toEqual(['clear', 'set', 'remove'])
  })

  it('removes outlier groups even when no detection is needed', async () => {
    await service.syncDraft('prov-1', COMPANY, {
      outlierGroups: [{ method: SyncMethodEnum.REMOVE, id: 'g1' }],
    })

    expect(outlierGroup.removeGroup).toHaveBeenCalledWith(REPORT, 'g1')
    expect(analysis.getDetectedOutlierEmployeeIds).not.toHaveBeenCalled()
  })

  // The invariant the ordering exists to serve: a group with members left in
  // it still aborts the whole batch.
  it('aborts the batch when a group still has members', async () => {
    outlierGroup.removeGroup.mockRejectedValue(
      new ConflictException('still has 1 member(s)'),
    )

    await expect(
      service.syncDraft('prov-1', COMPANY, {
        outlierGroups: [{ method: SyncMethodEnum.REMOVE, id: 'g1' }],
      }),
    ).rejects.toThrow(ConflictException)
    expect(reportDraft.touchDraft).not.toHaveBeenCalled()
  })

  // Sync only ever writes children, so without this the abandoned-draft reaper
  // would hard-delete a draft that is being actively edited.
  it('touches the report row so child-only edits count as activity', async () => {
    await service.syncDraft('prov-1', COMPANY, {
      employees: [{ method: SyncMethodEnum.CREATE, id: 'e1', data: {} }],
    })
    expect(reportDraft.touchDraft).toHaveBeenCalledWith('report-1')
  })

  it('does not touch the report row when the batch is rejected', async () => {
    await expect(
      service.syncDraft('prov-1', COMPANY, {
        employees: [{ method: SyncMethodEnum.CREATE, data: {} }],
      }),
    ).rejects.toThrow(BadRequestException)
    expect(reportDraft.touchDraft).not.toHaveBeenCalled()
  })

  it('routes removals to the remove appliers', async () => {
    await service.syncDraft('prov-1', COMPANY, {
      employees: [{ method: SyncMethodEnum.REMOVE, id: 'e1' }],
      criteria: [{ method: SyncMethodEnum.REMOVE, id: 'c1' }],
    })
    expect(employee.removeEmployee).toHaveBeenCalledWith(REPORT, 'e1')
    expect(criterion.removeCriterion).toHaveBeenCalledWith(REPORT, 'c1')
  })

  it('rejects a CREATE without id or data', async () => {
    await expect(
      service.syncDraft('prov-1', COMPANY, {
        roles: [{ method: SyncMethodEnum.CREATE, id: 'r1' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      service.syncDraft('prov-1', COMPANY, {
        roles: [{ method: SyncMethodEnum.CREATE, data: { title: 'R' } }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects a REMOVE without id', async () => {
    await expect(
      service.syncDraft('prov-1', COMPANY, {
        roles: [{ method: SyncMethodEnum.REMOVE }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects more than 1000 employee commands', async () => {
    const employees = Array.from({ length: 1001 }, (_, i) => ({
      method: SyncMethodEnum.CREATE,
      id: `e${i}`,
      data: {},
    }))
    await expect(
      service.syncDraft('prov-1', COMPANY, { employees }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(employee.createEmployee).not.toHaveBeenCalled()
  })
})
