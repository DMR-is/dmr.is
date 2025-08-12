import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { DeceasedApplicationController } from './deceased-application.controller'
import { DeceasedApplicationModel } from './deceased-application.model'

@Module({
  imports: [SequelizeModule.forFeature([DeceasedApplicationModel])],
  controllers: [DeceasedApplicationController],
  providers: [],
  exports: [],
})
export class DeceasedApplicationModule {}
