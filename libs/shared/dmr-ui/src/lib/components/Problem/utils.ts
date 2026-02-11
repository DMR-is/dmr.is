import type { AlertMessageType } from '../../island-is/lib/AlertMessage'
import { ProblemType } from './Problem'

export const mapProblemTypeToAlertMessageType = (
  variant: ProblemType,
): AlertMessageType => {
  switch (variant) {
    case 'no-data':
      return 'info'
    case 'bad-request':
      return 'warning'
    case 'server-error':
      return 'error'
    case 'not-found':
      return 'info'
    default:
      return 'error'
  }
}

export const mapStatusToProblemStatus = (statusCode?: number, variant?: ProblemType): number => {

  if(statusCode) return statusCode

  switch (variant) {
    case 'no-data':
      return 204
    case 'bad-request':
      return 400
    case 'server-error':
      return 500
    case 'not-found':
      return 404
    default:
      return 500
  }

}
