import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'

import { RegulationPublishService } from './regulation-publish.service'
import { IRegulationPublishService } from './regulation-publish.service.interface'
import { RegulationPublishServiceMock } from './regulation-publish.service.mock'

export { IRegulationPublishService }

const API_MOCK = process.env.API_MOCK === 'true'

@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: IRegulationPublishService,
      useClass: API_MOCK
        ? RegulationPublishServiceMock
        : RegulationPublishService,
    },
  ],
  exports: [IRegulationPublishService],
})
export class RegulationPublishModule {}
