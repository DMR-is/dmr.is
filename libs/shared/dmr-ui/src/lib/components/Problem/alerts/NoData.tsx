import { AlertMessage } from '../../../island-is/lib/AlertMessage'
import { mapProblemTypeToAlertMessageType } from '../utils'

type NoDataProps = {
  title?: string
  message?: string
}

export const NoData = ({
  title = 'Engin gögn fundust',
  message = 'Kanski þarf að síu eða reyna aftur',
}: NoDataProps) => {
  return <AlertMessage type={mapProblemTypeToAlertMessageType('no-data')} title={title} message={message} />
}
