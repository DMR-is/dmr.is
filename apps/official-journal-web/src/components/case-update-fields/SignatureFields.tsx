import { AccordionItem } from '@island.is/island-ui/core'

import { Signature } from '../signature/Signature'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const SignatureFields = ({ toggle, onToggle }: Props) => {
  return (
    <AccordionItem
      id="signature-fields"
      expanded={toggle}
      onToggle={onToggle}
      label="Undirritun"
      labelVariant="h5"
      iconVariant="small"
    >
      <Signature />
    </AccordionItem>
  )
}
