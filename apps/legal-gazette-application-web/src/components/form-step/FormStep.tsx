import { Stack, Text } from '@dmr.is/ui/components/island-is'

import { FormField } from '../../lib/forms/types'

type Props = {
  items: FormField[]
}

export const FormStep = ({ items }: Props) => {
  return (
    <Stack space={[2, 4]}>
      {items.map((item, index) => (
        <div data-section-index={index} key={index}>
          <Stack space={item.space ?? [1, 2]}>
            <Stack key={index} space={1}>
              {item.title && <Text variant="h4">{item.title}</Text>}
              {item.intro && item.intro}
            </Stack>
            {item.content}
          </Stack>
        </div>
      ))}
    </Stack>
  )
}
