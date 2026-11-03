import { Module } from '@nestjs/common'

import { RegulationAppendicesModule } from '@dmr.is/ojoi-modules'

import { RegulationsController } from './regulations.controller'

@Module({
  imports: [RegulationAppendicesModule],
  controllers: [RegulationsController],
})
export class RegulationsModule {}
