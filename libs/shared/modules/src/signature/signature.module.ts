import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SignatureModel } from './models/signature.model'
import { SignatureMemberModel } from './models/signature-member.model'
import { SignatureRecordModel } from './models/signature-record.model'
import { SignatureService } from './signature.service'
import { ISignatureService } from './signature.service.interface'

export { SignatureController } from './signature.controller'

@Module({
  imports: [
    SequelizeModule.forFeature([
      SignatureModel,
      SignatureRecordModel,
      SignatureMemberModel,
    ]),
    LoggingModule,
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
