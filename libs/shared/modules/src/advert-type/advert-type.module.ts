import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertTypeService } from './advert-type.service'
import { IAdvertTypeService } from './advert-type.service.interface'
import { models } from './models'

export { AdvertTypeAdminController } from './advert-type-admin.controller'
export { AdvertTypeController } from './advert-type.controller'

@Module({
  imports: [SequelizeModule.forFeature([...models]), LoggingModule],
  providers: [
    {
      provide: IAdvertTypeService,
      useClass: AdvertTypeService,
    },
  ],
  controllers: [],
  exports: [IAdvertTypeService],
})
export class AdvertTypeModule {}
