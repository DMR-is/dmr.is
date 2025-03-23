import { DocumentBuilder } from '@nestjs/swagger'

export const openApi = new DocumentBuilder()
  .setTitle('The Legal Gazette of Iceland API')
  .setDescription('The Legal Gazette of Iceland API')
  .setVersion('1.0')
  .build()
