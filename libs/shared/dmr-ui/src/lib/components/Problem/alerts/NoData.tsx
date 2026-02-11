import { AlertMessage } from '../../../island-is/lib/AlertMessage'
import { problemMessages } from '../messages'
import { mapProblemTypeToAlertMessageType } from '../utils'

type NoDataProps = {
  title?: string
  message?: string
}

export const NoData = ({
  title = problemMessages.alerts.noData.title,
  message = problemMessages.alerts.noData.message,
}: NoDataProps) => {
  return <AlertMessage type={mapProblemTypeToAlertMessageType('no-data')} title={title} message={message} />
}
