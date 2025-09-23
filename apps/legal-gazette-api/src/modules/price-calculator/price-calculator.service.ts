import { Inject, Injectable } from '@nestjs/common'

import { ITBRService } from '../tbr/tbr.service.interface'
import { IPriceCalculatorService } from './price-calculator.service.interface'

@Injectable()
export class PriceCalculatorService implements IPriceCalculatorService {
  constructor(@Inject(ITBRService) private readonly tbrService: ITBRService) {}
  calculate(): Promise<number> {
    throw new Error('Method not implemented.')
  }
}
