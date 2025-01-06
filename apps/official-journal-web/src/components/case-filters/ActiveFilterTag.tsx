import { Box, Icon, Tag, TagProps } from '@island.is/island-ui/core'

type Props = {
  label: string
  variant?: TagProps['variant']
  onClick?: () => void
}

export const ActiveFilterTag = ({
  label,
  variant = 'blue',
  onClick,
}: Props) => {
  return (
    <Tag variant={variant} outlined onClick={onClick}>
      <Box display="flex" alignItems="center" columnGap={1}>
        {label} <Icon icon="close" size="small" />
      </Box>
    </Tag>
  )
}
