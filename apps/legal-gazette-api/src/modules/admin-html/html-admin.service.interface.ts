import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { BackfillHtmlResponseDto } from './dto/html-admin.dto'

export interface IHtmlAdminService {
  previewBackfill(user: DMRUser): Promise<BackfillHtmlResponseDto>
  runBackfill(user: DMRUser): Promise<BackfillHtmlResponseDto>
}

export const IHtmlAdminService = Symbol('IHtmlAdminService')
