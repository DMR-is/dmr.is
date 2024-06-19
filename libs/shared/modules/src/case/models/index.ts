import { CaseDto } from './Case'
import { CaseCategoriesDto } from './CaseCategories'
import { CaseCommunicationStatusDto } from './CaseCommunicationStatus'
import { CaseStatusDto } from './CaseStatus'
import { CaseTagDto } from './CaseTag'

export { CaseDto, CaseTagDto, CaseStatusDto, CaseCommunicationStatusDto }

export const models = [
  CaseDto,
  CaseTagDto,
  CaseStatusDto,
  CaseCommunicationStatusDto,
  CaseCategoriesDto,
]

export default models
