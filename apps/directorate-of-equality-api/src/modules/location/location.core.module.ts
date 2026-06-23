import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { PostcodeModel } from './models/postcode.model'
import { RegionModel } from './models/region.model'
import { LocationService } from './location.service'
import { ILocationService } from './location.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([RegionModel, PostcodeModel])],
  providers: [
    {
      provide: ILocationService,
      useClass: LocationService,
    },
  ],
  exports: [ILocationService],
})
export class LocationCoreModule {}
