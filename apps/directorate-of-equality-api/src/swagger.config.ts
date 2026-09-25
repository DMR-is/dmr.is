import { DoeApplicationSwaggerModule } from './modules/swagger/doe-application.swagger.module'
import { DoeStatisticsSwaggerModule } from './modules/swagger/doe-statistics.swagger.module'
import { DoeWebSwaggerModule } from './modules/swagger/doe-web.swagger.module'
import { SetupSwaggerOptions } from './setupSwaggerDocument'

export const SWAGGER_CONFIG: SetupSwaggerOptions[] = [
  {
    swaggerPath: 'swagger/internal',
    swaggerTitle: 'Directorate of Equality — Internal API',
    swaggerDescription:
      'Internal API for direct communication between the DoE web application (doe-web) and the DoE API. ' +
      'Covers report management, workflow transitions (assign, deny, approve), ' +
      'company administration (status, ÍSAT, daily-fines flag), ' +
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
      'salary analysis, the draft-report lifecycle (create → bulk sync → submit) ' +
      'that holds report content the application system cannot store itself, ' +
      'and equality report submission. ' +
      'Consumed by the island.is application system on behalf of employers.',
    tag: 'Application API',
    modules: [DoeApplicationSwaggerModule],
    autoTagControllers: true,
  },
  {
    swaggerPath: 'swagger/statistics',
    swaggerTitle: 'Directorate of Equality — Statistics API',
    swaggerDescription:
      'Aggregate register counts for the Jafnlaunakerfi dashboard on island.is: ' +
      'companies by region, size, sector and certification status, validity rounds ' +
      'and national headcounts. Read without a credential, takes no parameters, ' +
      'and is recomputed once a day.',
    tag: 'Statistics API',
    modules: [DoeStatisticsSwaggerModule],
    autoTagControllers: true,
  },
]
