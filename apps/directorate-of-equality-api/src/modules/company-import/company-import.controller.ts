import {
  Controller,
  Inject,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { UserModel } from '../user/models/user.model'
import { CompanyImportResultDto } from './dto/company-import-result.dto'
import { ICompanyImportService } from './company-import.service.interface'

const ONE_MB = 1024 * 1024
const MAX_UPLOAD_BYTES = ONE_MB * 20

const FILE_BODY = {
  schema: {
    type: 'object',
    properties: { file: { type: 'string', format: 'binary' } },
    required: ['file'],
  },
}

const uploadPipe = new ParseFilePipe({
  validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES })],
})

@Controller({
  path: 'companies/import',
  version: '1',
})
@ApiTags('Company Import')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class CompanyImportController {
  constructor(
    @Inject(ICompanyImportService)
    private readonly companyImportService: ICompanyImportService,
  ) {}

  @Post('preview')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY)
  @DoeResponse({
    operationId: 'previewCompanyImport',
    type: CompanyImportResultDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async preview(
    @UploadedFile(uploadPipe) file: Express.Multer.File,
  ): Promise<CompanyImportResultDto> {
    return this.companyImportService.preview(file.buffer)
  }

  @Post('apply')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY)
  @DoeResponse({
    operationId: 'applyCompanyImport',
    type: CompanyImportResultDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async apply(
    @UploadedFile(uploadPipe) file: Express.Multer.File,
    @CurrentAdminUser() admin: UserModel,
  ): Promise<CompanyImportResultDto> {
    return this.companyImportService.apply(file.buffer, admin.id)
  }
}
