import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { OneSystemsModule } from '@dmr.is/clients-onesystems'

import { CompanyModel } from '../company/models/company.model'
import { MailboxDeliveryModel } from './models/mailbox-delivery.model'
import {
  MAILBOX_DELIVERY_KIND_CONFIGS,
  MAILBOX_DELIVERY_KINDS,
} from './mailbox-delivery.kinds'
import { MailboxDeliveryService } from './mailbox-delivery.service'
import { IMailboxDeliveryService } from './mailbox-delivery.service.interface'

/**
 * Binds `IMailboxDeliveryService`. Nothing imports this yet: no cron, task or
 * app module triggers a delivery, and every kind is still unconfigured (see
 * `mailbox-delivery.kinds.ts`).
 */
@Module({
  imports: [
    SequelizeModule.forFeature([MailboxDeliveryModel, CompanyModel]),
    OneSystemsModule,
  ],
  providers: [
    {
      provide: IMailboxDeliveryService,
      useClass: MailboxDeliveryService,
    },
    {
      provide: MAILBOX_DELIVERY_KIND_CONFIGS,
      useValue: MAILBOX_DELIVERY_KINDS,
    },
  ],
  exports: [IMailboxDeliveryService],
})
export class MailboxDeliveryCoreModule {}
