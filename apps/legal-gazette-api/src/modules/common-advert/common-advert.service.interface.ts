import { CreateCommonAdvertInternalDto } from './dto/create-common-advert.dto'

export interface ICommonCaseService {
  createCommonCase(body: CreateCommonAdvertInternalDto): Promise<void>
}
