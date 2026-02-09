import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'

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
