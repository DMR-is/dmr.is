import { AlertMessage } from '../../../island-is/lib/AlertMessage'
import { mapProblemTypeToAlertMessageType } from '../utils'

type ServerErrorProps = {
  title?: string
  message?: string
}

export const ServerError = ({
  title = 'Eitthvað fór úrskeiðis',
  message = 'Kanski þarf að síu eða reyna aftur',
}: ServerErrorProps) => {
  return <AlertMessage type={mapProblemTypeToAlertMessageType('no-data')} title={title} message={message} />
}
