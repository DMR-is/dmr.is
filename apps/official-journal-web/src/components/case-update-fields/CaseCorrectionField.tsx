import { AccordionItem } from '@island.is/island-ui/core'

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
