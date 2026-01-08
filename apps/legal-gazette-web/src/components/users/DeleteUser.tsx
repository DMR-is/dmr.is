import { Button } from '@dmr.is/ui/components/island-is'

type Props = {
  onDelete?: () => void
  loading?: boolean
}

export const DeleteUser = ({ onDelete, loading }: Props) => {
  return (
    <Button
      circle
      loading={loading}
      size="small"
      colorScheme="destructive"
      icon="trash"
      iconType="outline"
      onClick={() => onDelete?.()}
    />
  )
}
