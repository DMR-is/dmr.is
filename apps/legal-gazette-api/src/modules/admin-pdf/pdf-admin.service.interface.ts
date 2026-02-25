import { type DMRUser } from '@dmr.is/auth/dmrUser'

import { RegeneratePdfResponseDto } from './pdf-admin.dto'

export interface IPdfAdminService {
  regeneratePdf(
    advertId: string,
    publicationId: string,
    user: DMRUser,
  ): Promise<RegeneratePdfResponseDto>
}

export const IPdfAdminService = Symbol('IPdfAdminService')
