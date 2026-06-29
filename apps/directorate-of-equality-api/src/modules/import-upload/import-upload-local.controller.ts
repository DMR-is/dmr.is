import { Request } from 'express'

import {
  BadRequestException,
  Controller,
  HttpCode,
  Inject,
  Put,
  Query,
  Req,
} from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'

import { IImportUploadService } from './import-upload.service.interface'

/**
 * Local-development S3 bypass. {@link ImportUploadService.createUpload} points
 * the client's presigned-PUT here instead of S3 when no bucket is configured;
 * this endpoint stashes the bytes on disk so the key-based fetch flow is
 * otherwise unchanged. Intentionally unguarded — the browser PUT carries no
 * auth header (mirroring a real presigned URL) and the capability is the
 * unguessable key. The service refuses to store anything once a bucket is set,
 * so this is inert in every deployed environment. Hidden from Swagger.
 */
@Controller({
  path: 'imports',
  version: '1',
})
@ApiExcludeController()
export class ImportUploadLocalController {
  constructor(
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
  ) {}

  @Put('local')
  @HttpCode(204)
  async upload(@Query('key') key: string, @Req() req: Request): Promise<void> {
    if (!key) {
      throw new BadRequestException('Missing upload key')
    }

    // Raw bytes are parsed by the express.raw() middleware registered for this
    // route in main.ts, so the body is a Buffer rather than a parsed object.
    const body = req.body
    if (!Buffer.isBuffer(body)) {
      throw new BadRequestException('Expected a binary workbook body')
    }

    await this.importUploadService.storeLocalUpload(key, body)
  }
}
