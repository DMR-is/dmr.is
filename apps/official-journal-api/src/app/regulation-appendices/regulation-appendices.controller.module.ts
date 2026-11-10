import { Module } from '@nestjs/common'

import { RegulationAppendicesModule } from '@dmr.is/ojoi-modules'

import { RegulationAppendicesController } from './regulation-appendices.controller'

@Module({
  imports: [RegulationAppendicesModule],
  controllers: [RegulationAppendicesController],
})
export class RegulationAppendicesControllerModule {}
