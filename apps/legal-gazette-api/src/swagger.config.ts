import { AppModule } from './app/app.module'
import { ApplicationWebSwaggerModule } from './modules/swagger/application-web.swagger.module'
import { ExternalSystemsSwaggerModule } from './modules/swagger/external-systems.swagger.module'
import { IslandIsApplicationSwaggerModule } from './modules/swagger/island-is-application.swagger.module'
import { PublicWebSwaggerModule } from './modules/swagger/public-web.swagger.module'
import { SetupSwaggerOptions } from './setupSwaggerDocument'

export const SWAGGER_CONFIG: SetupSwaggerOptions[] = [
  {
    swaggerPath: 'swagger',
    swaggerTitle: 'Legal Gazette API',
    tag: 'Legal gazette - internal API',
    modules: [AppModule],
    autoTagControllers: true,
  },
  {
    swaggerPath: 'island-is-swagger',
    swaggerTitle: 'Legal Gazette Island.is API',
    tag: 'Legal gazette - common application',
    modules: [IslandIsApplicationSwaggerModule],
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
