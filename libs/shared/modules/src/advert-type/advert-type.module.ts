import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertTypeController } from './advert-type.controller'
import { AdvertTypeService } from './advert-type.service'
import { IAdvertTypeService } from './advert-type.service.interface'
import { models } from './models'

@Module({
  imports: [SequelizeModule.forFeature([...models]), LoggingModule],
  providers: [
    {
      provide: IAdvertTypeService,
      useClass: AdvertTypeService,
    },
  ],
  controllers: [AdvertTypeController],
  exports: [IAdvertTypeService],
})
export class AdvertTypeModule {}
