import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { SignatureModel } from '../../../models/signature.model'
import { SignatureService } from './signature.service'
import { ISignatureService } from './signature.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([SignatureModel, AdvertModel])],
  controllers: [],
  providers: [
    {
      provide: ISignatureService,
      useClass: SignatureService,
    },
  ],
  exports: [ISignatureService],
})
export class SignatureProviderModule {}
