import { AdvertTemplateTypeEnums } from '@dmr.is/constants'

import {
  templateAuglysing,
  templateGjaldskra,
  templateReglugerd,
} from './templates'

export const getTemplate = (type: AdvertTemplateTypeEnums) => {
  const DEFAULT = {
    html: templateAuglysing,
    type: AdvertTemplateTypeEnums.AUGLYSING,
  }

  const templateType = type.toLowerCase()

  switch (templateType) {
    case AdvertTemplateTypeEnums.AUGLYSING:
      return DEFAULT
    case AdvertTemplateTypeEnums.REGLUGERD:
      return {
        html: templateReglugerd,
        type: AdvertTemplateTypeEnums.REGLUGERD,
      }
    case AdvertTemplateTypeEnums.GJALDSKRA:
      return {
        html: templateGjaldskra,
        type: AdvertTemplateTypeEnums.GJALDSKRA,
      }
    default:
      return DEFAULT
  }
}

export const getTemplateDetails = () => {
  const enumArray = Object.values<AdvertTemplateTypeEnums>(
    AdvertTemplateTypeEnums,
  )
  const res = enumArray.map((slug) => {
    switch (slug) {
      case AdvertTemplateTypeEnums.AUGLYSING:
        return {
          slug: AdvertTemplateTypeEnums.AUGLYSING,
          title: 'Auglýsing',
        }
      case AdvertTemplateTypeEnums.REGLUGERD:
        return {
          slug: AdvertTemplateTypeEnums.REGLUGERD,
          title: 'Reglugerð',
        }
      case AdvertTemplateTypeEnums.GJALDSKRA:
        return {
          slug: AdvertTemplateTypeEnums.GJALDSKRA,
          title: 'Gjaldskrá',
        }
    }
  })

  return res
}
