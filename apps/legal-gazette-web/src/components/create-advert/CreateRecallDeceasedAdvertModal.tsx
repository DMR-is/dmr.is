import { Button } from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

export const CreateDeceasedAdvertModal = () => {
  const disclosure = (
    <Button variant="utility" size="small" icon="add" iconType="outline">
      Innköllun dánarbús
    </Button>
  )

  return (
    <Modal disclosure={disclosure} title="Innköllun dánarbús">
      <div></div>
    </Modal>
  )
}
