import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

type Props = {
  items: { title: string; value: string }[]
}

export const SummaryFields = ({ items }: Props) => {
  return (
    <Stack space={0} dividers={true}>
      {items.map((item, index) => (
        <Box padding={2} key={index}>
          <Inline
            alignY="center"
            justifyContent="spaceBetween"
            collapseBelow="md"
            space={2}
          >
            <Text variant="h4">{item.title}</Text>
            <Text>{item.value}</Text>
          </Inline>
        </Box>
      ))}
    </Stack>
  )
}
