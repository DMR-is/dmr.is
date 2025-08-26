import { Box, Text, Tooltip } from '@island.is/island-ui/core'

import { useGetPaymentStatus } from '../../hooks/api'
import * as styles from './CaseTable.css'

type InvoiceColProps = {
  caseId: string
  externalReference?: string
}

type PaymentStatusProps = {
  isSent: boolean
  isPaid: boolean
}

export const PaymentStatus = ({
  isSent,
  isPaid,
}: PaymentStatusProps): JSX.Element => {
  if (!isSent) {
    return (
      <Tooltip
        placement="top"
        color="red300"
        text="Ekki sent inn"
        as="button"
      />
    )
  }

  if (isSent && isPaid) {
    return (
      <Tooltip
        placement="top"
        color="blue300"
        text="Sent inn; Greitt"
        as="button"
      />
    )
  }

  return (
    <Tooltip
      placement="top"
      color="yellow300"
      text="Sent inn; Ógreitt"
      as="button"
    />
  )
}

export const CaseTableOverviewInvoiceCol = ({
  externalReference,
  caseId,
}: InvoiceColProps) => {
  const { data: paymentData } = useGetPaymentStatus({ caseId })

  return (
    <Box display="flex" className={styles.typeTableCell}>
      <Text truncate variant="medium">
        <span className={styles.tooltipText}>
          {externalReference || 'Finnst ekki'}
        </span>
      </Text>
      {paymentData && (
        <PaymentStatus
          isSent={!!paymentData?.created}
          isPaid={!!paymentData?.paid}
        />
      )}
    </Box>
  )
}
