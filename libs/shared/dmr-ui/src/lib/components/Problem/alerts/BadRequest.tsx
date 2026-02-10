import { AlertMessage } from '../../../island-is/lib/AlertMessage'
import { mapProblemTypeToAlertMessageType } from '../utils'

type BadRequestProps = {
  title?: string
  message?: string
}

export const BadRequest = ({
  title = 'Beiðni er ógild',
  message = 'Ekki er hægt að vinna úr beiðni',
}: BadRequestProps) => {
  return <AlertMessage type={mapProblemTypeToAlertMessageType('bad-request')} title={title} message={message} />
}
