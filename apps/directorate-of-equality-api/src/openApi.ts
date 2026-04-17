import { DocumentBuilder } from '@nestjs/swagger'

export const openApi = new DocumentBuilder()
  .setTitle('Directorate of Equality API')
  .setDescription('The API for the Directorate of Equality')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
