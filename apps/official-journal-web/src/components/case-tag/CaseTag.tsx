import { Tag } from '@island.is/island-ui/core'

import { CaseStatusEnum, CaseTagValueEnum } from '../../gen/fetch'

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
    case CaseTagValueEnum.EkkiHafi:
      return (
        <Tag disabled variant="blue">
          {tag}
        </Tag>
      )
    case CaseStatusEnum.Grunnvinnsla:
    case CaseStatusEnum.Yfirlestur:
    case CaseTagValueEnum.Yfirlestri:
      return (
        <Tag disabled variant="darkerBlue">
          {tag}
        </Tag>
      )
    case CaseStatusEnum.Tilbi:
      return (
        <Tag disabled variant="mint">
          {tag}
        </Tag>
      )
    case CaseTagValueEnum.ArfSkoun:
      return (
        <Tag disabled variant="rose">
          {tag}
        </Tag>
      )
    case CaseTagValueEnum.Samlesin:
      return (
        <Tag disabled variant="purple">
          {tag}
        </Tag>
      )
    default:
      return (
        <Tag disabled variant="blue">
          {tag}
        </Tag>
      )
  }
}
