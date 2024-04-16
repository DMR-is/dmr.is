import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { CaseController } from './case.controller'
import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'
import { CaseServiceMock } from './case.service.mock'

const MOCK_DATA = process.env.API_MOCK === 'true'

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
