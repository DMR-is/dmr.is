import { Module } from '@nestjs/common'

import { CompanyControllerModule } from './company/company.controller.module'
import { ForeclosureControllerModule } from './foreclosure/foreclosure.controller.module'

@Module({
  imports: [ForeclosureControllerModule, CompanyControllerModule],
})
export class ExternalSystemControllerModule {}
