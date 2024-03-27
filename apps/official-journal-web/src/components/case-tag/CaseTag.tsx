import { Tag } from '@island.is/island-ui/core'

import { CaseTagEnum } from '../../gen/fetch'

type Props = {
  tag?: string
}

export const CaseTag = ({ tag }: Props) => {
  if (!tag) {
    return null
  }

  const variant: React.ComponentProps<typeof Tag>['variant'] =
    tag === CaseTagEnum.EkkiHafi
      ? 'blue'
      : tag === CaseTagEnum.ArfSkoun
      ? 'rose'
      : tag === CaseTagEnum.Samlesin
      ? 'purple'
      : tag === CaseTagEnum.Yfirlestri
      ? 'mint'
      : 'blue'

  return <Tag variant={variant}>{tag}</Tag>
}
