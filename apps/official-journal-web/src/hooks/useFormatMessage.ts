import { MessageDescriptor, useIntl } from 'react-intl'

export const useFormatMessage = () => {
  const { formatMessage: fm } = useIntl()

  const formatMessage = (
    message: string | MessageDescriptor | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values?: Record<string, any>,
  ) => {
    if (!message) {
      if (process.env.NODE_ENV === 'development') {
        throw new Error('Message is undefined')
      }

      return ''
    }
    return typeof message === 'string' ? message : fm(message, values)
  }

  return { formatMessage }
}
