import { Modal } from '@dmr.is/ui/components/Modal/Modal'

export const CreateDeceasedAdvertModal = ({
  isVisible,
  setIsVisible,
}: {
  isVisible: boolean
  setIsVisible: (isVisible: boolean) => void
}) => {
  return (
    <Modal
      title="Innköllun dánarbús"
      isVisible={isVisible}
      onVisibilityChange={setIsVisible}
    >
      <div></div>
    </Modal>
  )
}
