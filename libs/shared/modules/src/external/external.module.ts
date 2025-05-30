import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'

import { ExternalService } from './external.service'
import { IExternalService } from './external.service.interface'
import { ExternalServiceMock } from './external.service.mock'

export { IExternalService }

const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: IExternalService,
      useClass: API_MOCK ? ExternalServiceMock : ExternalService,
    },
  ],
  exports: [IExternalService],
})
export class ExternalModule {}
