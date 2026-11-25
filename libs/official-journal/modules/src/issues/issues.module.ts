import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/shared-modules'

import { AdditionalPartiesModel } from '../additional-parties/models'
import { AdvertModel } from '../journal/models'
import { PdfProviderModule } from '../pdf/pdf.module'
import { UserModule } from '../user/user.module'
import { IssuesController } from './issues.controller'
import { IssuesModel } from './issues.model'
import { IssusesService } from './issues.service'
import { IIssuesService } from './issues.service.interface'
import { IssuesAdminController } from './issues-admin.controller'
import { IssuesReadService } from './issues-read.service'
import { IIssuesReadService } from './issues-read.service.interface'

/** The issues service, with no routes. */
@Module({
  imports: [
    PdfProviderModule,
    AwsModule,
    SequelizeModule.forFeature([
      AdvertModel,
      AdditionalPartiesModel,
      IssuesModel,
    ]),
  ],
  providers: [
    {
      provide: IIssuesService,
      useClass: IssusesService,
    },
  ],
  exports: [IIssuesService],
})
export class IssuesProviderModule {}

/**
 * Public `GET /issues`. Reads `IssuesModel` only, so the public journal API
 * does not load the PDF service (and through it the whole case module).
 */
@Module({
  imports: [SequelizeModule.forFeature([IssuesModel])],
  controllers: [IssuesController],
  providers: [{ provide: IIssuesReadService, useClass: IssuesReadService }],
})
export class IssuesModule {}

/**
 * Staff-only `POST /issues/generate`. UserModule backs RoleGuard, which
 * resolves the caller against the staff user table.
 */
@Module({
  imports: [IssuesProviderModule, UserModule],
  controllers: [IssuesAdminController],
})
export class IssuesAdminModule {}
