import { Text } from '../../island-is/lib/Text'
import { BadRequest } from './alerts/BadRequest'
import { NoData } from './alerts/NoData'
import { NotFound } from './alerts/NotFound'
import { ServerError } from './alerts/ServerError'
import * as styles from './Problem.css'
import {
  mapStatusToProblemStatus
} from './utils'

export type ProblemType =
  | 'no-data'
  | 'bad-request'
  | 'server-error'
  | 'not-found'

export type ProblemVariant = 'bordered' | 'alert'

export type ProblemProps = {
  type?: ProblemType
  variant?: ProblemVariant
  statusCode?: number
  title?: string
  message?: string
  titleSize?: 'h1' | 'h2' | 'h3'
}

export const Problem = ({
  type = 'server-error',
  variant = 'alert',
  title,
  message,
  statusCode,
  titleSize = 'h2',
}: ProblemProps) => {
  if (variant === 'alert') {
    switch (type) {
      case 'no-data':
        return <NoData title={title} message={message} />
      case 'bad-request':
        return <BadRequest title={title} message={message} />
      case 'not-found':
        return <NotFound title={title} message={message} />
      case 'server-error':
        return <ServerError title={title} message={message} />
      default:
        return <ServerError title={title} message={message} />
    }
  }

  const statusToUse = mapStatusToProblemStatus(statusCode)
  return (
    <div className={styles.problemBase({ variant, type })}>
      <Text variant="eyebrow" color='purple400' textAlign="center">
        {statusToUse}
      </Text>
      <Text marginBottom={[1,2]} variant={titleSize} as="h1" textAlign="center">
        {title}
      </Text>
      <Text>{message}</Text>
    </div>
  )
}
