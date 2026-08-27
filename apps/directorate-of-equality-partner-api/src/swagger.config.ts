import { PartnerSwaggerModule } from './modules/swagger/partner.swagger.module'
import { SetupSwaggerOptions } from './setupSwaggerDocument'

export const SWAGGER_CONFIG: SetupSwaggerOptions[] = [
  {
    swaggerPath: 'swagger/partner',
    swaggerTitle: 'Directorate of Equality — Partner API',
    swaggerDescription:
      'Public API for third-party submission of equality and salary reports. ' +
      'Intended for payroll and HR systems submitting on behalf of an employer, ' +
      'authenticated with an API key the employer issues to them. ' +
      'Reached over the public internet — unlike the island.is application API, ' +
      'which is served over X-Road.',
    tag: 'Partner API',
    modules: [PartnerSwaggerModule],
    autoTagControllers: true,
  },
]
