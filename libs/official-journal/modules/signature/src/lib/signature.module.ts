import {
  SignatureMemberModel,
  SignatureModel,
  SignatureRecordModel,
} from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SignatureController } from './signature.controller'
import { SignatureService } from './signature.service'
import { ISignatureService } from './signature.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      SignatureModel,
      SignatureRecordModel,
      SignatureMemberModel,
    ]),
  ],
  controllers: [SignatureController],
  providers: [
    {
      provide: ISignatureService,
      useClass: SignatureService,
    },
  ],
  exports: [ISignatureService],
})
export class SignatureModule {}
