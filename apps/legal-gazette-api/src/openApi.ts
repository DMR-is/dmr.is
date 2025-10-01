import { DocumentBuilder } from '@nestjs/swagger'

export const openApi = new DocumentBuilder()
  .setTitle('The Legal Gazette of Iceland API')
  .setDescription('The API for the Legal Gazette of Iceland')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
