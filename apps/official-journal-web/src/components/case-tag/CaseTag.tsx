import { Tag } from '@island.is/island-ui/core'

import { CaseStatusEnum, CaseTagEnum } from '../../gen/fetch'

type Props = {
  tag?: string
}

export const CaseTag = ({ tag }: Props) => {
  if (!tag) {
    if (process.env.NODE_ENV === 'development') {
      console.error('CaseTag: tag is missing, received:', tag)
    }

    return null
  }

  switch (tag) {
    case CaseStatusEnum.Innsent:
    case CaseTagEnum.EkkiHafi:
      return <Tag variant="blue">{tag}</Tag>
    case CaseStatusEnum.Grunnvinnsla:
    case CaseStatusEnum.Yfirlestur:
    case CaseTagEnum.Yfirlestri:
      return <Tag variant="darkerBlue">{tag}</Tag>
    case CaseStatusEnum.Tilbi:
      return <Tag variant="mint">{tag}</Tag>
    case CaseTagEnum.ArfSkoun:
      return <Tag variant="rose">{tag}</Tag>
    case CaseTagEnum.Samlesin:
      return <Tag variant="purple">{tag}</Tag>
    default:
      return <Tag variant="blue">{tag}</Tag>
  }
}
