import { PartnerSwaggerModule } from './modules/swagger/partner.swagger.module'
import { SetupSwaggerOptions } from './setupSwaggerDocument'

export const SWAGGER_CONFIG: SetupSwaggerOptions[] = [
  {
    swaggerPath: 'swagger/partner',
    swaggerTitle: 'Directorate of Equality — Partner API',
    swaggerDescription:
      'Public API for third-party submission of equality and salary reports. ' +
      'Intended for payroll and HR systems submitting on behalf of an employer, ' +
      'authenticated either with a company key (`doe_…`) issued for that employer, ' +
      'or with a vendor client key (`doev_…`) acting for every employer that has ' +
      'delegated to the vendor — see section D of the integration guide.',
    tag: 'Partner API',
    modules: [PartnerSwaggerModule],
    autoTagControllers: true,
  },
]
