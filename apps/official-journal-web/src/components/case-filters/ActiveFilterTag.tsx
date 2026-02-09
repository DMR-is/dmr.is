import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
// TODO: Change import
import { TagProps } from '@island.is/island-ui/core'

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
