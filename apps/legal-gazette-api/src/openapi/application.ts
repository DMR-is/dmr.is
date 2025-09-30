import { DocumentBuilder } from '@nestjs/swagger'

export const applicationOpenApi = new DocumentBuilder()
  .setTitle('The Legal Gazette of Iceland Application API')
  .setDescription('The Application API for the Legal Gazette of Iceland')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
