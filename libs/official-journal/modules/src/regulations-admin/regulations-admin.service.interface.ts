import {
  CreateRegulationCancelBody,
  CreateRegulationChangeBody,
  RegulationDraft,
  UpdateRegulationCancelBody,
  UpdateRegulationChangeBody,
  UpdateRegulationDraftBody,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IRegulationsAdminService {
  getDraft(draftId: string): Promise<ResultWrapper<RegulationDraft>>
  updateDraft(draftId: string, body: UpdateRegulationDraftBody): Promise<ResultWrapper>
  deleteDraft(draftId: string): Promise<ResultWrapper>
  createChange(body: CreateRegulationChangeBody & { changingId: string }): Promise<ResultWrapper>
  updateChange(changeId: string, body: UpdateRegulationChangeBody): Promise<ResultWrapper>
  deleteChange(changeId: string): Promise<ResultWrapper>
  createCancel(body: CreateRegulationCancelBody & { changingId: string }): Promise<ResultWrapper>
  updateCancel(cancelId: string, body: UpdateRegulationCancelBody): Promise<ResultWrapper>
  deleteCancel(cancelId: string): Promise<ResultWrapper>
}

export const IRegulationsAdminService = Symbol('IRegulationsAdminService')
