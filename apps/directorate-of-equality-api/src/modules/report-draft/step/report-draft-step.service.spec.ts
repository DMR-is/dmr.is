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
import { ReportDraftStepService } from './report-draft-step.service'

const REPORT_ID = 'report-id-1'
const CRITERION_ID = 'criterion-id-1'
const SUB_ID = 'sub-id-1'
const STEP_ID = 'step-id-1'
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

describe('ReportDraftStepService', () => {
  let service: ReportDraftStepService
  let findOwnedDraft: jest.Mock
  let criterionFindOne: jest.Mock
  let subFindByPk: jest.Mock
  let stepFindAll: jest.Mock
  let stepFindByPk: jest.Mock
  let stepBuild: jest.Mock
  let roleStepDestroy: jest.Mock
  let personalStepDestroy: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest.fn().mockResolvedValue({ id: REPORT_ID })
    criterionFindOne = jest.fn().mockResolvedValue({ id: CRITERION_ID })
    subFindByPk = jest
      .fn()
      .mockResolvedValue({ id: SUB_ID, reportCriterionId: CRITERION_ID })
    stepFindAll = jest.fn().mockResolvedValue([])
    stepFindByPk = jest.fn().mockResolvedValue(null)
    stepBuild = jest.fn()
    roleStepDestroy = jest.fn()
    personalStepDestroy = jest.fn()

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftStepService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportDraftService, useValue: { findOwnedDraft } },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { findOne: criterionFindOne },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: { findByPk: subFindByPk },
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: {
            findAll: stepFindAll,
            findByPk: stepFindByPk,
            build: stepBuild,
          },
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

    service = module.get(ReportDraftStepService)
  })

  describe('listSteps', () => {
    it('400s when the sub-criterion does not exist', async () => {
      subFindByPk.mockResolvedValueOnce(null)

      await expect(
        service.listSteps(PROVIDER_ID, COMPANY, SUB_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('400s when the sub-criterion belongs to another draft', async () => {
      subFindByPk.mockResolvedValueOnce({
        id: SUB_ID,
        reportCriterionId: CRITERION_ID,
      })
      criterionFindOne.mockResolvedValueOnce(null)

      await expect(
        service.listSteps(PROVIDER_ID, COMPANY, SUB_ID),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('createStep', () => {
    it('builds and saves a step with the client-minted id under its parent', async () => {
      const save = jest.fn()
      const built: Record<string, unknown> = { save }
      stepBuild.mockReturnValueOnce(built)

      await service.createStep(report, STEP_ID, {
        subCriterionId: SUB_ID,
        order: 1,
        description: 'd',
        score: 3,
      })

      expect(stepBuild).toHaveBeenCalledWith(
        expect.objectContaining({
          reportSubCriterionId: SUB_ID,
          order: 1,
          description: 'd',
          score: 3,
        }),
      )
      expect(built.id).toBe(STEP_ID)
      expect(save).toHaveBeenCalled()
    })

    it('updates in place when the id already exists (upsert)', async () => {
      const update = jest.fn()
      stepFindByPk.mockResolvedValueOnce({
        id: STEP_ID,
        reportSubCriterionId: SUB_ID,
        update,
      })

      await service.createStep(report, STEP_ID, {
        subCriterionId: SUB_ID,
        order: 2,
        description: 'd2',
        score: 4,
      })

      expect(update).toHaveBeenCalledWith({
        order: 2,
        description: 'd2',
        score: 4,
      })
      expect(stepBuild).not.toHaveBeenCalled()
    })

    it('400s when the parent sub-criterion is not in the draft', async () => {
      subFindByPk.mockResolvedValueOnce(null)

      await expect(
        service.createStep(report, STEP_ID, {
          subCriterionId: SUB_ID,
          order: 1,
          description: 'd',
          score: 3,
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('updateStep', () => {
    it('patches the step', async () => {
      const update = jest.fn()
      stepFindByPk.mockResolvedValueOnce({
        id: STEP_ID,
        reportSubCriterionId: SUB_ID,
        update,
      })

      await service.updateStep(report, STEP_ID, { score: 5 })

      expect(update).toHaveBeenCalledWith({ score: 5 })
    })

    it('404s updating a step not in the draft', async () => {
      stepFindByPk.mockResolvedValueOnce(null)

      await expect(
        service.updateStep(report, STEP_ID, { score: 5 }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('removeStep', () => {
    it('removes assignments then the step on remove', async () => {
      const destroy = jest.fn()
      stepFindByPk.mockResolvedValueOnce({
        id: STEP_ID,
        reportSubCriterionId: SUB_ID,
        destroy,
      })

      await service.removeStep(report, STEP_ID)

      expect(roleStepDestroy).toHaveBeenCalledWith({
        where: { reportSubCriterionStepId: STEP_ID },
      })
      expect(personalStepDestroy).toHaveBeenCalledWith({
        where: { reportSubCriterionStepId: STEP_ID },
      })
      expect(destroy).toHaveBeenCalled()
    })
  })
})
