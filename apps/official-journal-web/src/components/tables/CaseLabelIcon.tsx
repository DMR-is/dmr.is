import { Icon } from '@island.is/island-ui/core'
import { messages } from '../../lib/messages'
import { Tooltip } from '../tooltip/Tooltip'

type Props = {
  label: string
}

export const CaseLabelIcon = ({ label }: Props) => {
  switch (label) {
    case 'fasttrack':
      return (
        <Tooltip
          text={messages.components.tables.caseOverview.labels.fasttrack}
        >
          <Icon color="blue400" type="outline" icon="timer" />
        </Tooltip>
      )
    case 'warning':
      return (
        <Tooltip text={messages.components.tables.caseOverview.labels.warning}>
          <Icon color="blue400" icon="warning" />
        </Tooltip>
      )
    case 'info':
      return (
        <Tooltip text={messages.components.tables.caseOverview.labels.info}>
          <Icon color="blue400" icon="informationCircle" />
        </Tooltip>
      )
    default:
      return null
  }
}
