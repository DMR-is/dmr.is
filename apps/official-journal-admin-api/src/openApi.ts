import { DocumentBuilder } from '@nestjs/swagger'

export const openApi = new DocumentBuilder()
  .setTitle('The Official Journal of Iceland Admin API')
  .setDescription(
    'Admin api for the Official Journal of Iceland. This API is used to manage the content of the Official Journal of Iceland.',
  )
  .setVersion('1.0')
  .addBearerAuth()
  .build()
