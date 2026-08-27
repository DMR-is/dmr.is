import { BadRequestException } from '@nestjs/common'
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
      setEmployeeGroup: jest.fn(),
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

  // The whole point of re-deriving here: edits in this batch can push an
  // employee out of the lágmarksmengi, and submit rejects a membership for a
  // non-outlier, so the row has to go with them.
  it('drops memberships of employees the recalculation cleared', async () => {
    outlierGroup.getMemberEmployeeIds.mockResolvedValue(['e1', 'e2'])
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set(['e2']))

    await service.syncDraft('prov-1', COMPANY, {
      employees: [
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e1',
          data: { baseSalary: 900000 },
        },
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
          data: { baseSalary: 900000 },
        },
      ],
    })

    expect(outlierGroup.clearEmployeeGroups).not.toHaveBeenCalled()
  })

  // Stale client state, not a client error — 400ing would roll back the very
  // edits that made the employee a non-outlier.
  it('skips a membership set for an employee that is no longer an outlier', async () => {
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set(['e2']))

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

    expect(outlierGroup.setEmployeeGroup).toHaveBeenCalledTimes(1)
    expect(outlierGroup.setEmployeeGroup).toHaveBeenCalledWith(
      REPORT,
      'e2',
      'g1',
      new Set(['e2']),
    )
    expect(reportDraft.touchDraft).toHaveBeenCalledWith('report-1')
  })

  // removeGroup refuses to orphan members, so a group the applicant sees as
  // emptied by the recalculation is only removable after the prune.
  it('removes outlier groups after the stale memberships are dropped', async () => {
    outlierGroup.getMemberEmployeeIds.mockResolvedValue(['e1'])
    analysis.getDetectedOutlierEmployeeIds.mockResolvedValue(new Set<string>())
    const order: string[] = []
    outlierGroup.clearEmployeeGroups.mockImplementation(() => {
      order.push('clear')
    })
    outlierGroup.removeGroup.mockImplementation(() => {
      order.push('remove')
    })

    await service.syncDraft('prov-1', COMPANY, {
      employees: [
        {
          method: SyncMethodEnum.UPDATE,
          id: 'e1',
          data: { baseSalary: 900000 },
        },
      ],
      outlierGroups: [{ method: SyncMethodEnum.REMOVE, id: 'g1' }],
    })

    expect(order).toEqual(['clear', 'remove'])
  })

  it('removes outlier groups even when no detection is needed', async () => {
    await service.syncDraft('prov-1', COMPANY, {
      outlierGroups: [{ method: SyncMethodEnum.REMOVE, id: 'g1' }],
    })

    expect(outlierGroup.removeGroup).toHaveBeenCalledWith(REPORT, 'g1')
    expect(analysis.getDetectedOutlierEmployeeIds).not.toHaveBeenCalled()
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
