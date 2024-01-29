import { DocumentBuilder } from '@nestjs/swagger'

export const openApi = new DocumentBuilder()
  .setTitle('The Official Journal of Iceland API')
  .setDescription(
    'API for advarts and publication in the Official Journal of Iceland.',
  )
  .setVersion('0.1')
  .build()
