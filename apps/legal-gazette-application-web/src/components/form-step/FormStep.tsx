import { Stack, Text } from '@dmr.is/ui/components/island-is'

type FormStepItem = {
  title?: string
  intro?: React.ReactNode
  content: React.ReactNode | React.ReactNode[]
}

type Props = {
  items: FormStepItem[]
}

export const FormStep = ({ items }: Props) => {
  return (
    <Stack space={[2, 3]}>
      {items.map((item, index) => (
        <Stack space={[2, 3]} key={index}>
          <Stack key={index} space={1}>
            {item.title && <Text variant="h3">{item.title}</Text>}
            {item.intro && item.intro}
          </Stack>
          {item.content}
        </Stack>
      ))}
    </Stack>
  )
}
