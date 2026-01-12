import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { ApplicationModel } from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import { UserModel } from '../../models/users.model'
import { LGNationalRegistryProviderModule } from '../national-registry/national-registry.provider.module'
import { TypeCategoriesProviderModule } from '../type-categories/type-categories.provider.module'
import { PriceCalculatorProviderModule } from './calculator/price-calculator.provider.module'
import { PdfProviderModule } from './pdf/pdf.provider.module'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    LGNationalRegistryProviderModule,
    SequelizeModule.forFeature([
      UserModel,
      AdvertModel,
      AdvertPublicationModel,
      ApplicationModel,
      CaseModel,
    ]),

    PdfProviderModule,
    TypeCategoriesProviderModule,
    forwardRef(() => PriceCalculatorProviderModule),
  ],
  controllers: [],
  providers: [
    {
      provide: IAdvertService,
      useClass: AdvertService,
    },
  ],
  exports: [IAdvertService],
})
export class AdvertProviderModule {}
