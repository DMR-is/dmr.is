import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { SignatureService } from './signature.service'
import { ISignatureService } from './signature.service.interface'
import {
  SignatureModel,
  SignatureRecordModel,
  SignatureMemberModel,
} from '@dmr.is/official-journal/models'

@Module({
  imports: [
    SequelizeModule.forFeature([
      SignatureModel,
      SignatureRecordModel,
      SignatureMemberModel,
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: ISignatureService,
      useClass: SignatureService,
    },
  ],
  exports: [ISignatureService],
})
export class SignatureModule {}
