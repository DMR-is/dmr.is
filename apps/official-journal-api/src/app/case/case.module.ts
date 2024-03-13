import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'
import { CaseController } from './case.controller'
import { ICaseService } from './case.service.interface'
import { CaseService } from './case.service'
import { CaseServiceMock } from './case.service.mock'

const MOCK_DATA = true

@Module({
  imports: [LoggingModule],
  controllers: [CaseController],
  providers: [
    {
      provide: ICaseService,
      useClass: MOCK_DATA ? CaseServiceMock : CaseService,
    },
  ],
})
export class CaseModule {}
