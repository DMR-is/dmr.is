import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SubscriberModel } from '../../models/subscriber.model'
import { LGNationalRegistryProviderModule } from '../national-registry/national-registry.provider.module'
import { SubscriberAdminService } from './subscriber-admin.service'
import { ISubscriberAdminService } from './subscriber-admin.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([SubscriberModel]),
    LGNationalRegistryProviderModule,
  ],
  controllers: [],
  providers: [
    {
      provide: ISubscriberAdminService,
      useClass: SubscriberAdminService,
    },
  ],
  exports: [ISubscriberAdminService],
})
export class SubscriberAdminProviderModule {}
