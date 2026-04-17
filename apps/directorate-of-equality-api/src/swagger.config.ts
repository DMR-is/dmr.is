import { AppModule } from './app/app.module'
import { SetupSwaggerOptions } from './setupSwaggerDocument'

export const SWAGGER_CONFIG: SetupSwaggerOptions[] = [
  {
    swaggerPath: 'swagger',
    swaggerTitle: 'Directorate of Equality API',
    tag: 'Directorate of Equality API',
    modules: [AppModule],
  },
]
