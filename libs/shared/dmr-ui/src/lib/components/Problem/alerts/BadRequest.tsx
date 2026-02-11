import { AlertMessage } from '../../../island-is/lib/AlertMessage'
import { problemMessages } from '../messages'
import { mapProblemTypeToAlertMessageType } from '../utils'

type BadRequestProps = {
  title?: string
  message?: string
}

export const BadRequest = ({
  title = problemMessages.alerts.badRequest.title,
  message = problemMessages.alerts.badRequest.message,
}: BadRequestProps) => {
  return <AlertMessage type={mapProblemTypeToAlertMessageType('bad-request')} title={title} message={message} />
}
