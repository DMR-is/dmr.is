import { DocumentBuilder } from '@nestjs/swagger'

export const openApi = new DocumentBuilder()
  .setTitle('The Official Journal of Iceland API')
  .setDescription(
    'API for published adverts for the Official Journal of Iceland.',
  )
  .setVersion('1.0')
  .build()
