import { Button } from '@dmr.is/ui/components/island-is'

type Props = {
  onDelete?: () => void
  loading?: boolean
}

export const DeleteUserButton = ({ onDelete, loading }: Props) => {
  return (
    <Button
      circle
      title="Eyða notanda"
      loading={loading}
      size="small"
      colorScheme="destructive"
      icon="trash"
      iconType="outline"
      onClick={() => onDelete?.()}
    />
  )
}
