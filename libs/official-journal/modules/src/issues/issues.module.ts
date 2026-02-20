import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvisoryLockModule, AwsModule } from '@dmr.is/shared/modules'

import { AdvertModel } from '../journal/models'
import { PdfModule } from '../pdf/pdf.module'
import { UserModule } from '../user/user.module'
import { IssuesController } from './issues.controller'
import { IssuesModel } from './issues.model'
import { IssusesService } from './issues.service'
import { IIssuesService } from './issues.service.interface'

@Module({
  imports: [
    AdvisoryLockModule,
    PdfModule,
    AwsModule,
    UserModule,
    SequelizeModule.forFeature([AdvertModel, IssuesModel]),
  ],
  controllers: [IssuesController],
  providers: [
    {
      provide: IIssuesService,
      useClass: IssusesService,
    },
  ],
  exports: [],
})
export class IssuesModule {}
