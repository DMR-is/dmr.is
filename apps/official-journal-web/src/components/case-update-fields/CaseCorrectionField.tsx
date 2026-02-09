import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'

import { Corrections } from '../corrections/Corrections'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const CaseCorrectionFields = ({ toggle, onToggle }: Props) => {
  return (
    <AccordionItem
      id="correction-field"
      expanded={toggle}
      onToggle={onToggle}
      label="Leiðréttingar"
      labelVariant="h5"
      iconVariant="small"
    >
      <Corrections />
    </AccordionItem>
  )
}
