import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import { ReportModel } from '../../report/models/report.model'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { ReportDraftSubCriterionService } from './report-draft-sub-criterion.service'

const REPORT_ID = 'report-id-1'
const CRITERION_ID = 'criterion-id-1'
const SUB_ID = 'sub-id-1'
const PROVIDER_ID = 'island-is-application-uuid-draft'

const report = { id: REPORT_ID } as ReportModel

const COMPANY = {
  id: 'company-1',
  nationalId: '5500000000',
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown as CompanyDto

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportDraftSubCriterionService', () => {
  let service: ReportDraftSubCriterionService
  let findOwnedDraft: jest.Mock
  let criterionFindOne: jest.Mock
  let subFindAll: jest.Mock
  let subFindByPk: jest.Mock
  let subBuild: jest.Mock
  let stepFindAll: jest.Mock
  let stepDestroy: jest.Mock
  let roleStepDestroy: jest.Mock
  let personalStepDestroy: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    criterionFindOne = jest.fn().mockResolvedValue({ id: CRITERION_ID })
    subFindAll = jest.fn().mockResolvedValue([])
    subFindByPk = jest.fn().mockResolvedValue(null)
    subBuild = jest.fn()
    stepFindAll = jest.fn().mockResolvedValue([])
    stepDestroy = jest.fn()
    roleStepDestroy = jest.fn()
    personalStepDestroy = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftSubCriterionService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { findOne: criterionFindOne },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: {
            findAll: subFindAll,
            findByPk: subFindByPk,
            build: subBuild,
          },
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: { findAll: stepFindAll, destroy: stepDestroy },
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: { destroy: roleStepDestroy },
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: { destroy: personalStepDestroy },
        },
      ],
    }).compile()

    service = module.get(ReportDraftSubCriterionService)
  })

  describe('listSubCriteria', () => {
    it('404s when the parent criterion is not in the draft', async () => {
      criterionFindOne.mockResolvedValueOnce(null)

      await expect(
        service.listSubCriteria(PROVIDER_ID, COMPANY, CRITERION_ID),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('createSubCriterion', () => {
    it('builds and saves a sub-criterion with the client-minted id under its parent', async () => {
      const save = jest.fn()
      const built: Record<string, unknown> = { save }
      subBuild.mockReturnValueOnce(built)

      await service.createSubCriterion(report, SUB_ID, {
        criterionId: CRITERION_ID,
        title: '  Menntun  ',
        description: 'd',
        weight: 0.5,
      })

      expect(criterionFindOne).toHaveBeenCalledWith({
        where: { id: CRITERION_ID, reportId: REPORT_ID },
        attributes: ['id'],
      })
      expect(subBuild).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Menntun',
          description: 'd',
          weight: 0.5,
          reportCriterionId: CRITERION_ID,
        }),
      )
      expect(built.id).toBe(SUB_ID)
      expect(save).toHaveBeenCalled()
    })

    it('updates in place when the id already exists (upsert)', async () => {
      const update = jest.fn()
      subFindByPk.mockResolvedValueOnce({
        id: SUB_ID,
        reportCriterionId: CRITERION_ID,
        update,
      })

      await service.createSubCriterion(report, SUB_ID, {
        criterionId: CRITERION_ID,
        title: 'Menntun',
        description: 'd',
        weight: 0.5,
      })

      expect(update).toHaveBeenCalledWith({
        title: 'Menntun',
        description: 'd',
        weight: 0.5,
      })
      expect(subBuild).not.toHaveBeenCalled()
    })

    it('400s when the parent criterion is not in the draft', async () => {
      criterionFindOne.mockResolvedValueOnce(null)

      await expect(
        service.createSubCriterion(report, SUB_ID, {
          criterionId: CRITERION_ID,
          title: 'x',
          description: 'd',
          weight: 0.5,
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('updateSubCriterion', () => {
    it('patches the sub-criterion', async () => {
      const update = jest.fn()
      subFindByPk.mockResolvedValueOnce({
        id: SUB_ID,
        reportCriterionId: CRITERION_ID,
        update,
      })

      await service.updateSubCriterion(report, SUB_ID, { title: '  x  ' })

      expect(update).toHaveBeenCalledWith({ title: 'x' })
    })

    it('404s updating a sub-criterion not in the draft', async () => {
      subFindByPk.mockResolvedValueOnce(null)

      await expect(
        service.updateSubCriterion(report, SUB_ID, { title: 'x' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('removeSubCriterion', () => {
    it('cascades steps + assignments on remove', async () => {
      const destroy = jest.fn()
      subFindByPk.mockResolvedValueOnce({
        id: SUB_ID,
        reportCriterionId: CRITERION_ID,
        destroy,
      })
      stepFindAll.mockResolvedValueOnce([{ id: 'step-1' }])

      await service.removeSubCriterion(report, SUB_ID)

      expect(roleStepDestroy).toHaveBeenCalledWith({
        where: { reportSubCriterionStepId: ['step-1'] },
      })
      expect(personalStepDestroy).toHaveBeenCalledWith({
        where: { reportSubCriterionStepId: ['step-1'] },
      })
      expect(stepDestroy).toHaveBeenCalledWith({ where: { id: ['step-1'] } })
      expect(destroy).toHaveBeenCalled()
    })
  })
})
