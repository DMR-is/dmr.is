import { Injectable } from '@nestjs/common'

import { ForeclosureDto, GetForeclosuresDto } from './dto/foreclosure.dto'
import { IForeclosureService } from './foreclosure.service.interface'

@Injectable()
export class ForeclosureService implements IForeclosureService {
  getForeclosures(): Promise<GetForeclosuresDto> {
    throw new Error('Method not implemented.')
  }
  getForeclosureById(id: string): Promise<ForeclosureDto> {
    throw new Error('Method not implemented.')
  }
}
