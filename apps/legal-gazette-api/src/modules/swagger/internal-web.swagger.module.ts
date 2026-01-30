import { Module } from '@nestjs/common'

import { SubscriberAdminControllerModule } from '../admin-subscribers/subscriber-admin.controller.module'
import { AdvertControllerModule } from '../advert/advert.controller.module'
import { IssuesControllerModule } from '../advert/issues/issues.controller.module'
import { PublicationControllerModule } from '../advert/publications/publication.controller.module'
import { AdvertPublishControllerModule } from '../advert/publish/advert-publish.controller.module'
import { SignatureControllerModule } from '../advert/signature/signature.controller.module'
import { StatisticsControllerModule } from '../advert/statistics/statistics.controller.module'
import { BaseEntityControllerModule } from '../base-entity/base-entity.controller.module'
import { CategoryControllerModule } from '../base-entity/category/category.controller.module'
import { CourtDistrictControllerModule } from '../base-entity/court-district/court-district.controller.module'
import { StatusControllerModule } from '../base-entity/status/status.controller.module'
import { TypeControllerModule } from '../base-entity/type/type.controller.module'
import { CaseControllerModule } from '../case/case.controller.module'
import { CommentControllerModule } from '../comment/comment.controller.module'
import { CommunicationChannelControllerModule } from '../communication-channel/communication-channel.module'
import { FeeCodeModule } from '../fee-code/fee-code.controller.module'
import { LGNationalRegistryControllerModule } from '../national-registry/national-registry.controller.module'
import { PaymentsControllerModule } from '../payments/payment.controller.module'
import { TBRCompanySettingsControllerModule } from '../settings/tbr-company/tbr-company-settings.controller.module'
import { SettlementControllerModule } from '../settlement/settlement.controller.module'
import { UserControllerModule } from '../users/users.controller.module'

@Module({
  imports: [
    AdvertControllerModule,
    IssuesControllerModule,
    PublicationControllerModule,
    StatisticsControllerModule,
    BaseEntityControllerModule,
    CategoryControllerModule,
    CourtDistrictControllerModule,
    StatusControllerModule,
    CommunicationChannelControllerModule,
    TypeControllerModule,
    CaseControllerModule,
    CommentControllerModule,
    FeeCodeModule,
    SettlementControllerModule,
    UserControllerModule,
    SubscriberAdminControllerModule,
    SignatureControllerModule,
    TBRCompanySettingsControllerModule,
    LGNationalRegistryControllerModule,
    PaymentsControllerModule,
    AdvertPublishControllerModule,
  ],
})
export class InternalWebSwaggerModule {}
