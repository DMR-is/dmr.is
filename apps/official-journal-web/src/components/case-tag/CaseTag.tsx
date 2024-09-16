import { Tag } from '@island.is/island-ui/core'

import { CaseStatusTitleEnum, CaseTagTitleEnum } from '../../gen/fetch'

type Props = {
  tag?: string
}

export const CaseTag = ({ tag }: Props) => {
  if (!tag) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('CaseTag: tag is missing, received:', tag)
    }

    return null
  }

  switch (tag) {
    case CaseStatusTitleEnum.Innsent:
    case CaseTagTitleEnum.EkkiHafi:
      return (
        <Tag disabled variant="blue">
          {tag}
        </Tag>
      )
    case CaseStatusTitleEnum.Grunnvinnsla:
    case CaseStatusTitleEnum.Yfirlestur:
    case CaseTagTitleEnum.Yfirlestri:
      return (
        <Tag disabled variant="darkerBlue">
          {tag}
        </Tag>
      )
    case CaseStatusTitleEnum.Tilbi:
      return (
        <Tag disabled variant="mint">
          {tag}
        </Tag>
      )
    case CaseTagTitleEnum.ArfSkoun:
      return (
        <Tag disabled variant="rose">
          {tag}
        </Tag>
      )
    case CaseTagTitleEnum.Samlesin:
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
