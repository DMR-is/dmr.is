import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import caseModels from '../case/models'
import { models as advertModels } from '../journal/models'
import { RegulationAppendicesService } from './regulation-appendices.service'
import { IRegulationAppendicesService } from './regulation-appendices.service.interface'

/**
 * TEMPORARY - a bridge for regulations published through Eplica, which drops
 * their appendices. Remove together with its only consumer,
 * `RegulationAppendicesController` in official-journal-api; the conditions for
 * removal are on that controller.
 */
@Module({
  imports: [SequelizeModule.forFeature([...caseModels, ...advertModels])],
  providers: [
    {
      provide: IRegulationAppendicesService,
      useClass: RegulationAppendicesService,
    },
  ],
  exports: [IRegulationAppendicesService],
})
export class RegulationAppendicesModule {}
