import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import caseModels from '../case/models'
import { models as advertModels } from '../journal/models'
import { RegulationAppendicesService } from './regulation-appendices.service'
import { IRegulationAppendicesService } from './regulation-appendices.service.interface'

/**
 * TEMPORARY - a bridge for regulations published through Eplica, which drops
 * their appendices. Remove together with its only consumer,
 * `RegulationsController` in official-journal-api; the conditions for removal
 * are on that controller.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([...caseModels, ...advertModels]),
    LoggingModule,
  ],
  providers: [
    {
      provide: IRegulationAppendicesService,
      useClass: RegulationAppendicesService,
    },
  ],
  exports: [IRegulationAppendicesService],
})
export class RegulationAppendicesModule {}
