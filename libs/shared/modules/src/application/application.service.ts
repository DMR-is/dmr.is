import { Injectable } from '@nestjs/common'

import { IApplicationService } from './application.service.interface'

@Injectable()
export class ApplicationService implements IApplicationService {
  getApplication(id: string): string {
    return `Application with id ${id}`
  }
}
