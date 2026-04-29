import { DoeWebSwaggerModule } from './modules/swagger/doe-web.swagger.module'
import { SetupSwaggerOptions } from './setupSwaggerDocument'

export const SWAGGER_CONFIG: SetupSwaggerOptions[] = [
  {
    swaggerPath: 'swagger',
    swaggerTitle: 'Directorate of Equality API - DoE Web',
    tag: 'Directorate of Equality API',
    modules: [DoeWebSwaggerModule],
    autoTagControllers: true,
  },
]
