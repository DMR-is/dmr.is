import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'

export { ICaseService } from './case.service.interface'
export { CaseServiceMock } from './case.service.mock'

const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: ICaseService,
      useClass: API_MOCK ? CaseServiceMock : CaseService,
    },
  ],
  exports: [ICaseService],
})
export class SharedCaseModule {}
