import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { ParseNationalIdPipe } from '../../core/pipes/parse-national-id.pipe'
import {
  PostholfDocumentDto,
  PostholfDocumentQueryDto,
} from './dto/postholf-document.dto'
import { PostholfCallbackGuard } from './guards/postholf-callback.guard'
import { IPostholfDocumentService } from './postholf-document.service.interface'

/**
 * The Skjalaveita interface — the callback island.is makes when a company opens
 * one of our notices in its island.is mailbox.
 *
 * The path shape is **theirs**, not ours: `{base}/{kennitala}/documents/{documentId}`.
 * Mounting it under the standard `/api/v1/` prefix means the base URL registered
 * with Stafrænt Ísland is simply `https://<doe-api>/api/v1/postholf`, so nothing
 * about `api-routing.ts` has to bend.
 *
 * Guarded by `PostholfCallbackGuard` rather than `TokenJwtAuthGuard`: this caller
 * is island.is's mailbox backend, not a DoE user, and the checklist requires
 * audience and scope validation that the shared guard does not do.
 */
@Controller({ path: 'postholf', version: '1' })
@ApiTags('Pósthólf')
@ApiBearerAuth()
@UseGuards(PostholfCallbackGuard)
export class PostholfCallbackController {
  constructor(
    @Inject(IPostholfDocumentService)
    private readonly documentService: IPostholfDocumentService,
  ) {}

  @Get(':kennitala/documents/:documentId')
  @ApiParam({
    name: 'kennitala',
    type: String,
    description: "The recipient company's kennitala.",
  })
  @ApiParam({
    name: 'documentId',
    type: String,
    description: 'The documentId this system registered with Skjalatilkynning.',
  })
  @DoeResponse({
    operationId: 'getPostholfDocument',
    type: PostholfDocumentDto,
    successDescription:
      'The notice, base64-encoded. Body omitted when includeDocument=false.',
    include404: true,
  })
  async getDocument(
    @Param('kennitala', ParseNationalIdPipe) kennitala: string,
    @Param('documentId') documentId: string,
    @Query() query: PostholfDocumentQueryDto,
  ): Promise<PostholfDocumentDto> {
    // Their spec defaults includeDocument to true; only an explicit "false"
    // suppresses the body.
    const includeDocument = query.includeDocument !== 'false'

    return this.documentService.getDocument(
      kennitala,
      documentId,
      includeDocument,
    )
  }
}
