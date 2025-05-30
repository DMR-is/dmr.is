import { CreateCommonCaseInternalDto } from './dto/common-case.dto'

export interface ICommonCaseService {
  createCommonCase(body: CreateCommonCaseInternalDto): Promise<void>
}
