import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import { AdvertInvolvedPartyModel } from '../journal/models/advert-involved-party.model'
import { AdditionalPartiesService } from './additional-parties.service'
import { AdditionalPartiesModel } from './models'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdditionalPartiesModel,
      AdvertInvolvedPartyModel,
    ]),
    LoggingModule,
  ],
  providers: [AdditionalPartiesService],
  exports: [AdditionalPartiesService],
})
export class AdditionalPartiesModule {}
