import { CaseTagModel } from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseTagController } from './case-tag.controller'
import { CaseTagService } from './case-tag.service'
import { ICaseTagService } from './case-tag.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseTagModel])],
  controllers: [CaseTagController],
  providers: [
    {
      provide: ICaseTagService,
      useClass: CaseTagService,
    },
  ],
  exports: [ICaseTagService],
})
export class CaseTagModule {}
