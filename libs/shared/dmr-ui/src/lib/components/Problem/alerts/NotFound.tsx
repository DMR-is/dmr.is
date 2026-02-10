import { AlertMessage } from '../../../island-is/lib/AlertMessage'
import { problemMessages } from '../messages'
import { mapProblemTypeToAlertMessageType } from '../utils'

type NotFoundProps = {
  title?: string
  message?: string
}

export const NotFound = ({
  title = problemMessages.alerts.notFound.title,
  message = problemMessages.alerts.notFound.message,
}: NotFoundProps) => {
  const type = mapProblemTypeToAlertMessageType('not-found')

  return <AlertMessage type={type} title={title} message={message} />
}
