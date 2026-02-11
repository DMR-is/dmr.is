import { AlertMessage } from '../../../island-is/lib/AlertMessage'
import { problemMessages } from '../messages'
import { mapProblemTypeToAlertMessageType } from '../utils'

type ServerErrorProps = {
  title?: string
  message?: string
}

export const ServerError = ({
  title = problemMessages.alerts.serverError.title,
  message = problemMessages.alerts.serverError.message,
}: ServerErrorProps) => {
  return <AlertMessage type={mapProblemTypeToAlertMessageType('no-data')} title={title} message={message} />
}
