import { CaseCommunicationStatus } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

export const caseCommunicationStatusMapper = (status: string) => {
  return withTryCatch(() => {
    switch (status) {
      case CaseCommunicationStatus.Done:
        return CaseCommunicationStatus.Done
      case CaseCommunicationStatus.HasAnswers:
        return CaseCommunicationStatus.HasAnswers
      case CaseCommunicationStatus.NotStarted:
        return CaseCommunicationStatus.NotStarted
      case CaseCommunicationStatus.WaitingForAnswers:
        return CaseCommunicationStatus.WaitingForAnswers
    }
    throw new Error(`Case communication status<${status}> not found`)
  }, `Failed to migrate case communication status with title: ${status}`)
}
