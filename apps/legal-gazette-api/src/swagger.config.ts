import { AppModule } from './app/app.module'
import { ApplicationWebModule } from './modules/swagger/application-web.module'
import { ExternalSystemsModule } from './modules/swagger/external-systems.module'
import { IslandIsApplicationModule } from './modules/swagger/island-is-application.module'
import { PublicWebModule } from './modules/swagger/public-web.module'
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
    modules: [IslandIsApplicationModule],
  },
  {
    swaggerPath: 'public-swagger',
    swaggerTitle: 'Legal Gazette Public API',
    tag: 'Legal gazette - public API',
    modules: [PublicWebModule],
  },
  {
    swaggerPath: 'external-swagger',
    swaggerTitle: 'Legal Gazette External API',
    tag: 'Legal gazette - external API',
    modules: [ExternalSystemsModule],
  },
  {
    swaggerPath: 'application-web-swagger',
    swaggerTitle: 'Legal Gazette Application Web API',
    tag: 'Legal gazette - application web API',
    modules: [ApplicationWebModule],
  },
]
