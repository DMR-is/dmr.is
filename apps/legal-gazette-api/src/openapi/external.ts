import { DocumentBuilder } from '@nestjs/swagger'

export const externalOpenApi = new DocumentBuilder()
  .setTitle('The Legal Gazette of Iceland External API')
  .setDescription('The External API for the Legal Gazette of Iceland')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
