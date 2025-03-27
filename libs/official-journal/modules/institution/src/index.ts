// dto
export { GetInstitutionResponse } from './lib/dto/get-institution-response.dto'
export { GetInstitutionsQueryParams } from './lib/dto/get-institutions-query.dto'
export { GetInstitutionsResponse } from './lib/dto/get-institutions-response.dto'
export {
  CreateInstitution,
  GetInstitution,
  GetInstitutions,
  Institution,
  InstitutionDto,
  InstitutionQuery,
  UpdateInstitution,
} from './lib/dto/institution.dto'

// migrations
export { institutionMigrate } from './lib/migrations/institution.migrate'

// models
export { InstitutionModel } from './lib/models/institution.model'

// controllers
export { InstitutionAdminController } from './lib/controllers/institution-admin.controller'
export { InstitutionController } from './lib/controllers/institution.controller'

// services
export { InstitutionService } from './lib/institution.service'
export { IInstitutionService } from './lib/institution.service.interface'

// module
export { InstitutionModule } from './lib/institution.module'
