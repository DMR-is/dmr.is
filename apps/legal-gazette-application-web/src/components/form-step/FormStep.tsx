import { SkeletonLoader, Stack, Text } from '@dmr.is/ui/components/island-is'

import { FormField } from '../../lib/forms/types'

type Props = {
  items: FormField[]
  loading?: boolean
}

export const FormStep = ({ items, loading }: Props) => {
  return (
    <Stack space={[2, 4]}>
      {items.map((item, index) => (
        <div data-section-index={index} key={index}>
          <Stack space={item.space ?? [1, 2]}>
            <Stack key={index} space={1}>
              {item.title && <Text variant="h4">{item.title}</Text>}
              {item.intro && item.intro}
            </Stack>
            {loading ? (
            <SkeletonLoader height={126} space={[2, 3]} borderRadius="large" />)
            : (<>{item.content}</>
            )}
          </Stack>
        </div>
      ))}
    </Stack>
  )
}
