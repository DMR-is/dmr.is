import { ApplicationApiModule } from './modules/application/application.api.module'
import { DoeWebSwaggerModule } from './modules/swagger/doe-web.swagger.module'
import { SetupSwaggerOptions } from './setupSwaggerDocument'

export const SWAGGER_CONFIG: SetupSwaggerOptions[] = [
  {
    swaggerPath: 'swagger/internal',
    swaggerTitle: 'Directorate of Equality — Internal API',
    swaggerDescription:
      'Internal API for direct communication between the DoE web application (doe-web) and the DoE API. ' +
      'Covers report management, workflow transitions (assign, deny, approve, start fines), ' +
      'comments, statistics, and user administration. ' +
      'Not intended for external consumers.',
    tag: 'Internal API',
    modules: [DoeWebSwaggerModule],
    autoTagControllers: true,
  },
  {
    swaggerPath: 'swagger/application',
    swaggerTitle: 'Directorate of Equality — Application API',
    swaggerDescription:
      'Public-facing API for equality report submissions through island.is. ' +
      'Covers company information lookup, Excel template download, workbook import, ' +
      'salary analysis, and equality report submission. ' +
      'Consumed by the island.is application system on behalf of employers.',
    tag: 'Application API',
    modules: [ApplicationApiModule],
    autoTagControllers: true,
  },
]
