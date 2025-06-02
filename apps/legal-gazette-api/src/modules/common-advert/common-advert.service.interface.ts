import { CreateCommonAdvertInternalDto } from './dto/common-advert.dto'

export interface ICommonCaseService {
  createCommonCase(body: CreateCommonAdvertInternalDto): Promise<void>
}
