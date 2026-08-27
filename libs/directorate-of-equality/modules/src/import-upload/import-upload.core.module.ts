import { Module } from '@nestjs/common'

import { AwsModule } from '@dmr.is/shared-modules'

import { ImportUploadService } from './import-upload.service'
import { IImportUploadService } from './import-upload.service.interface'

@Module({
  imports: [AwsModule],
  providers: [
    {
      provide: IImportUploadService,
      useClass: ImportUploadService,
    },
  ],
  exports: [IImportUploadService],
})
export class ImportUploadCoreModule {}
