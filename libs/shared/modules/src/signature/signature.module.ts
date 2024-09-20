import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import caseModels from '../case/models'
import advertModels from '../journal/models'
import models from './models'
import { SignatureService } from './signature.service'
import { ISignatureService } from './signature.service.interface'

export { SignatureController } from './signature.controller'

@Module({
  imports: [
    SequelizeModule.forFeature([...models, ...advertModels, ...caseModels]),
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
