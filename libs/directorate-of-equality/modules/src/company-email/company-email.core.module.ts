import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/shared-modules'

import { CompanyCoreModule } from '../company/company.core.module'
import { CompanyEventCoreModule } from '../company-event/company-event.core.module'
import { ImportUploadCoreModule } from '../import-upload/import-upload.core.module'
import { DoeMailModule } from '../mail/doe-mail.module'
import { CompanyEmailModel } from './models/company-email.model'
import { CompanyEmailAttachmentModel } from './models/company-email-attachment.model'
import { CompanyEmailRecipientModel } from './models/company-email-recipient.model'
import { CompanyEmailService } from './company-email.service'
import { ICompanyEmailService } from './company-email.service.interface'

/**
 * Sends admin-authored mail to companies.
 *
 * Depends on `CompanyCoreModule` rather than reaching into the company tables
 * itself: recipient resolution has to run the identical query the company list
 * runs, and that query lives behind `ICompanyService`. The dependency is
 * one-way — nothing in the company module knows this one exists — so there is no
 * cycle.
 *
 * `AwsModule` is here for the attachment archive only; the sending itself goes
 * through `IDoeMailService`, so a custom message leaves from the same sender
 * identity as every other mail this system issues.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      CompanyEmailModel,
      CompanyEmailRecipientModel,
      CompanyEmailAttachmentModel,
    ]),
    CompanyCoreModule,
    CompanyEventCoreModule,
    DoeMailModule,
    ImportUploadCoreModule,
    AwsModule,
  ],
  providers: [
    {
      provide: ICompanyEmailService,
      useClass: CompanyEmailService,
    },
  ],
  exports: [ICompanyEmailService],
})
export class CompanyEmailCoreModule {}
