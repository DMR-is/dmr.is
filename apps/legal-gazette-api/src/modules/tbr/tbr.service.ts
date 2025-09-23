import { Injectable } from '@nestjs/common'

import { ITBRService } from './tbr.service.interface'

@Injectable()
export class TBRService implements ITBRService {
  postExternalPayment(): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
