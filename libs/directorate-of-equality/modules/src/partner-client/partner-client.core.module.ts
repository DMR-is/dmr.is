import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { PartnerClientModel } from './models/partner-client.model'
import { PartnerClientKeyModel } from './models/partner-client-key.model'
import { PartnerDelegationModel } from './models/partner-delegation.model'
import { PartnerClientService } from './partner-client.service'
import { IPartnerClientService } from './partner-client.service.interface'
import { PartnerDelegationService } from './partner-delegation.service'
import { IPartnerDelegationService } from './partner-delegation.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      PartnerClientModel,
      PartnerClientKeyModel,
      PartnerDelegationModel,
      CompanyModel,
    ]),
  ],
  providers: [
    {
      provide: IPartnerClientService,
      useClass: PartnerClientService,
    },
    {
      provide: IPartnerDelegationService,
      useClass: PartnerDelegationService,
    },
  ],
  exports: [IPartnerClientService, IPartnerDelegationService],
})
export class PartnerClientCoreModule {}
