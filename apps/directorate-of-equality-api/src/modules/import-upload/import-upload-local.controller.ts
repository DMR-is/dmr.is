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

import {
  IImportUploadService,
} from '@dmr.is/doe-modules'

import { PublicRoute } from '../../core/decorators/public-route.decorator'

/**
 * Local-development S3 bypass. {@link ImportUploadService.createUpload} points
 * the client's presigned-PUT here instead of S3 when no bucket is configured;
 * this endpoint stashes the bytes on disk so the key-based fetch flow is
 * otherwise unchanged. Intentionally unguarded — the browser PUT carries no
 * auth header (mirroring a real presigned URL) and the capability is the
 * unguessable key. `ImportUploadApiModule` only registers this controller when
 * no bucket is configured, so the route does not exist in any deployed
 * environment. Hidden from Swagger.
 */
@Controller({
  path: 'imports',
  version: '1',
})
@ApiExcludeController()
@PublicRoute(
  'local-dev presigned-PUT stand-in; the browser PUT carries no Authorization header, and the capability is the unguessable key',
)
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
