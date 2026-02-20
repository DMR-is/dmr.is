import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvisoryLockModule, AwsModule } from '@dmr.is/shared/modules'

import { AdvertModel } from '../journal/models'
import { PdfModule } from '../pdf/pdf.module'
import { IssusesService } from './issues.service'
import { IIssuesService } from './issues.service.interface'

@Module({
  imports: [
    AdvisoryLockModule,
    PdfModule,
    AwsModule,
    SequelizeModule.forFeature([AdvertModel]),
  ],
  providers: [
    {
      provide: IIssuesService,
      useClass: IssusesService,
    },
  ],
  exports: [],
})
export class IssuesModule {}
