import { DocumentBuilder } from '@nestjs/swagger'

export const openApi = new DocumentBuilder()
  .setTitle('The Official Journal of Iceland Application API')
  .setDescription(
    'This api is responsible for communications with the island.is application system.',
  )
  .setVersion('1.0')
  .build()
