import { Button } from '@dmr.is/ui/components/island-is/Button'

type Props = {
  onRestore?: () => void
  loading?: boolean
}

export const RestoreUserButton = ({ onRestore, loading }: Props) => {
  return (
    <Button
      title="Endurheimta notanda"
      circle
      variant="ghost"
      loading={loading}
      size="small"
      icon="share"
      iconType="outline"
      onClick={() => onRestore?.()}
    />
  )
}
