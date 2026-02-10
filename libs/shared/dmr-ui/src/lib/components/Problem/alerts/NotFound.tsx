import { AlertMessage } from '../../../island-is/lib/AlertMessage'
import { mapProblemTypeToAlertMessageType } from '../utils'

type NotFoundProps = {
  title?: string
  message?: string
}

export const NotFound = ({
  title = 'Eitthvað fór úrskeiðis',
  message = 'Síða eða gögn fundust ekki,',
}: NotFoundProps) => {
  const type = mapProblemTypeToAlertMessageType('not-found')

  return <AlertMessage type={type} title={title} message={message} />
}
