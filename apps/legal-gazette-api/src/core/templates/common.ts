import { isBase64 } from 'class-validator'

import { AdvertModel } from '../../models/advert.model'
import { TypeIdEnum } from '../../models/type.model'
import { getForeclosureTemplate } from './custom/foreclosure'

export function getCommonTemplate(model: AdvertModel): string {
  if (model.typeId === TypeIdEnum.FORECLOSURE && model.foreclosure) {
    return getForeclosureTemplate(model.foreclosure)
  }

  const htmlToUse = isBase64(model.content)
    ? Buffer.from(model.content ?? '', 'base64').toString('utf-8')
    : model.content

  return `${htmlToUse}`
}
