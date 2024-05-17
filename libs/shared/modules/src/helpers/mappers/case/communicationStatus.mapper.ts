import { CaseCommunicationStatus, CaseTag } from '@dmr.is/shared/dto'

export const caseCommunicationStatusMapper = (status?: string | null) => {
  if (!status) return null

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

  return null
}
