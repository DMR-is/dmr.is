import { Case } from '../../gen/fetch'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import * as styles from './CaseTooltips.css'
type Props = {
  case: Case
}

const WAITING_ANSWERS_VALUE = 'Beðið eftir svörum'
const NEW_ANSWER_VALUE = 'Svör hafa borist'

export const CaseToolTips = ({ case: caseData }: Props) => {
  const isFastTrack = caseData.fastTrack
  const isWaitingForAnswers =
    caseData.communicationStatus.value === WAITING_ANSWERS_VALUE
  const hasNewAnswer = caseData.communicationStatus.value === NEW_ANSWER_VALUE

  if (!isFastTrack && !isWaitingForAnswers && !hasNewAnswer) return null

  return (
    <div className={styles.iconWrapper}>
      {isFastTrack && <CaseLabelTooltip type="fasttrack" />}
      {isWaitingForAnswers && <CaseLabelTooltip type="waiting" />}
      {hasNewAnswer && <CaseLabelTooltip type="new" />}
    </div>
  )
}
