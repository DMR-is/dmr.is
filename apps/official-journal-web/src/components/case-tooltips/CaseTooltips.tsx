import { CommunicationStatusTitleEnum } from '../../gen/fetch'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import * as styles from './CaseTooltips.css'
type Props = {
  fastTrack?: boolean
  status?: CommunicationStatusTitleEnum
}

export const CaseToolTips = ({ fastTrack = false, status }: Props) => {
  const waitingForAnswers =
    status === CommunicationStatusTitleEnum.BeðiðEftirSvörum
  const hasNewAnswer = status === CommunicationStatusTitleEnum.SvörHafaBorist

  return (
    <div className={styles.iconWrapper}>
      {fastTrack ? <CaseLabelTooltip type="fasttrack" /> : null}
      {waitingForAnswers ? <CaseLabelTooltip type="waiting" /> : null}
      {hasNewAnswer ? <CaseLabelTooltip type="new" /> : null}
    </div>
  )
}
