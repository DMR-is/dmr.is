import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import caseModels from '../case/models'
import advertModels from '../journal/models'
import models from './models'

@Module({
  imports: [
    SequelizeModule.forFeature([...models, ...advertModels, ...caseModels]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class SignatureModule {}
