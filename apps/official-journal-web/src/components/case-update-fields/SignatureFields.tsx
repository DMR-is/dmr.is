import { AccordionItem } from '@island.is/island-ui/core'

import { Signatures } from '../signature/Signatures'

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
      <Signatures />
    </AccordionItem>
  )
}
