import { AlertMessage } from '@dmr.is/ui/components/island-is'

import { TRPCClientErrorLike } from '@trpc/client'
import { TRPC_ERROR_CODE_KEY, TRPC_ERROR_CODE_NUMBER } from '@trpc/server'

type Props = {
  error: TRPCClientErrorLike<{
    transformer: false
    errorShape: {
      code: TRPC_ERROR_CODE_NUMBER
      message: string
      data: {
        code: TRPC_ERROR_CODE_KEY
        httpStatus: number
        path?: string
        stack?: string
      }
    }
  }>
}

type AlertMessageType = React.ComponentProps<typeof AlertMessage>['type']

export const TRPCErrorAlert = ({ error }: Props) => {
  let title = 'Villa kom upp'
  let message = 'Villa kom upp við að sækja gögn'
  let type: AlertMessageType = 'warning'

  switch (error.data?.code) {
    case 'UNAUTHORIZED':
      title = 'Óheimill aðgangur'
      message = 'Þú hefur ekki aðgang að þessari síðu'
      type = 'error'
      break
    case 'FORBIDDEN':
      title = 'Heimild skortir'
      message = 'Þú hefur ekki heimild til að skoða þessi gögn'
      type = 'error'
      break
    case 'NOT_FOUND':
      title = 'Gagnasett ekki fundið'
      message = 'Gagnasettið fannst ekki'
      type = 'warning'
      break
    case 'INTERNAL_SERVER_ERROR':
      title = 'Villa kom upp á vefþjóni'
      message = 'Villa kom upp við að vinna með gögnin'
      type = 'error'
      break
    case 'BAD_REQUEST':
      title = 'Ógild beiðni'
      message = 'Vefþjónn gat ekki unnið með beiðnina'
      type = 'warning'
      break
  }

  return <AlertMessage title={title} message={message} type={type} />
}
