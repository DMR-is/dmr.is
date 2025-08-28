import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../../lib/constants'
import { CourtDistrictDto } from './dto/court-district.dto'

@BaseEntityTable({ tableName: LegalGazetteModels.COURT_DISTRICT })
export class CourtDistrictModel extends BaseEntityModel<CourtDistrictDto> {}
