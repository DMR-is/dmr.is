import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import {
  BackfilledPublicationsListDto,
  BackfilledPublicationsQueryDto,
  BackfillHtmlResponseDto,
  BackfillJobStatusDto,
  BackfillStartResponseDto,
} from './dto/html-admin.dto'

export interface IHtmlAdminService {
  previewBackfill(user: DMRUser): Promise<BackfillHtmlResponseDto>
  startBackfill(user: DMRUser): BackfillHtmlResponseDto
  getBackfillStatus(): BackfillJobStatusDto
  getBackfilledPublications(
    query: BackfilledPublicationsQueryDto,
  ): Promise<BackfilledPublicationsListDto>
  startRevert(user: DMRUser): BackfillStartResponseDto
  getRevertStatus(): BackfillJobStatusDto
}

export const IHtmlAdminService = Symbol('IHtmlAdminService')
