import { DocumentBuilder } from '@nestjs/swagger'

export const internalOpenApi = new DocumentBuilder()
  .setTitle('The Legal Gazette of Iceland Internal API')
  .setDescription('The Internal API for the Legal Gazette of Iceland')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
