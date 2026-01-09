import { Button } from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

export const CreateBankruptcyAdvertModal = () => {
  const disclosure = (
    <Button variant="utility" size="small" icon="add" iconType="outline">
      Innköllun þrotabús
    </Button>
  )

  return (
    <Modal disclosure={disclosure} title="Innköllun þrotabús">
      <div></div>
    </Modal>
  )
}
