import { Stack, Text } from '@dmr.is/ui/components/island-is'

import { ResponsiveSpace } from '@island.is/island-ui/core'

type FormStepItem = {
  title?: string | React.ReactNode
  intro?: React.ReactNode
  content: React.ReactNode | React.ReactNode[]
  space?: [number]
}

type Props = {
  items: FormStepItem[]
}

export const FormStep = ({ items }: Props) => {
  return (
    <Stack space={[2, 4]}>
      {items.map((item, index) => (
        <div data-section-index={index} key={index}>
          <Stack space={(item.space as ResponsiveSpace) ?? [1, 2]}>
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
