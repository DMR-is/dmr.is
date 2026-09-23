import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { PartnerClientModel } from './models/partner-client.model'
import { PartnerClientKeyModel } from './models/partner-client-key.model'
import { PartnerClientService } from './partner-client.service'
import { IPartnerClientService } from './partner-client.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([PartnerClientModel, PartnerClientKeyModel]),
  ],
  providers: [
    {
      provide: IPartnerClientService,
      useClass: PartnerClientService,
    },
  ],
  exports: [IPartnerClientService],
})
export class PartnerClientCoreModule {}
