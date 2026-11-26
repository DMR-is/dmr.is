import { ApplicationWebSwaggerModule } from './modules/swagger/application-web.swagger.module'
import { ExternalSystemsSwaggerModule } from './modules/swagger/external-systems.swagger.module'
import { InternalWebSwaggerModule } from './modules/swagger/internal-web.swagger.module'
import { PublicWebSwaggerModule } from './modules/swagger/public-web.swagger.module'
import { SetupSwaggerOptions } from './setupSwaggerDocument'

export const SWAGGER_CONFIG: SetupSwaggerOptions[] = [
  {
    swaggerPath: 'swagger',
    swaggerTitle: 'Legal Gazette API',
    tag: 'Legal gazette - internal API',
    modules: [InternalWebSwaggerModule],
  },
  {
    swaggerPath: 'public-swagger',
    swaggerTitle: 'Legal Gazette Public API',
    tag: 'Legal gazette - public API',
    modules: [PublicWebSwaggerModule],
  },
  {
    swaggerPath: 'external-swagger',
    swaggerTitle: 'Legal Gazette External API',
    tag: 'Legal gazette - external API',
    modules: [ExternalSystemsSwaggerModule],
  },
  {
    swaggerPath: 'application-web-swagger',
    swaggerTitle: 'Legal Gazette Application Web API',
    tag: 'Legal gazette - application web API',
    modules: [ApplicationWebSwaggerModule],
  },
]
