import { Module } from '@nestjs/common'

import { AwsModule } from '@dmr.is/shared-modules'

import { CompanyFileService } from './company-file.service'
import { ICompanyFileService } from './company-file.service.interface'

@Module({
  imports: [AwsModule],
  providers: [
    {
      provide: ICompanyFileService,
      useClass: CompanyFileService,
    },
  ],
  exports: [ICompanyFileService],
})
export class CompanyFileCoreModule {}
