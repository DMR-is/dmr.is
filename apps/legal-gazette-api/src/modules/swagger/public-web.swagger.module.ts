import { Module } from '@nestjs/common'

import { IssuesControllerModule } from '../advert/issues/issues.controller.module'
import { PublicationControllerModule } from '../advert/publications/publication.controller.module'
import { CategoryControllerModule } from '../base-entity/category/category.controller.module'
import { TypeControllerModule } from '../base-entity/type/type.controller.module'
import { SubscriberControllerModule } from '../subscribers/subscriber.controller.module'

@Module({
  imports: [
    TypeControllerModule,
    CategoryControllerModule,
    SubscriberControllerModule,
    PublicationControllerModule,
    IssuesControllerModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PublicWebSwaggerModule {}
