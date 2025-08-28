import { Stack, Text } from '@island.is/island-ui/core'

type Props = {
  title: string
  value: string | string[]
  variant?: 'default' | 'blue'
}

export const AdvertInfoItem = ({
  title,
  value,
  variant: variant = 'default',
}: Props) => {
  return (
    <Stack space={0}>
      <Text variant="h5">{title}</Text>
      {Array.isArray(value) ? (
        <Stack space={0}>
          {value.map((item, index) => (
            <Text key={index} variant="small">
              {item}
            </Text>
          ))}
        </Stack>
      ) : (
        <Text
          fontWeight={variant === 'blue' ? 'semiBold' : 'regular'}
          color={variant === 'blue' ? 'blue400' : undefined}
          variant="small"
        >
          {value}
        </Text>
      )}
    </Stack>
  )
}
