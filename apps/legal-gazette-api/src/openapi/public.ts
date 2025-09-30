import { DocumentBuilder } from '@nestjs/swagger'

export const publicOpenApi = new DocumentBuilder()
  .setTitle('The Legal Gazette of Iceland Public API')
  .setDescription('The Public API for the Legal Gazette of Iceland')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
