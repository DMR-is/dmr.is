import { defineMessages } from 'react-intl'

export const toastMessages = {
  updateAdvert: defineMessages({
    success: {
      id: 'lg.web:toast.updateAdvert.success',
      defaultMessage: 'Auglýsing uppfærð',
      description: 'Success message when an advert is updated',
    },
    failure: {
      id: 'lg.web:toast.updateAdvert.failure',
      defaultMessage: 'Villa kom upp við að uppfæra auglýsingu',
      description: 'Failure message when an advert update fails',
    },
  }),
  updateCategory: defineMessages({
    success: {
      id: 'lg.web:toast.updateCategory.success',
      defaultMessage: 'Flokkur auglýsingar uppfærður',
      description: 'Success message when an advert category is updated',
    },
    failure: {
      id: 'lg.web:toast.updateCategory.failure',
      defaultMessage: 'Villa kom upp við að uppfæra flokk auglýsingar',
      description: 'Failure message when an advert category update fails',
    },
  }),
  updateStatus: defineMessages({
    success: {
      id: 'lg.web:toast.updateStatus.success',
      defaultMessage: 'Staða auglýsingar uppfærð',
      description: 'Success message when an advert status is updated',
    },
    failure: {
      id: 'lg.web:toast.updateStatus.failure',
      defaultMessage: 'Villa kom upp við að uppfæra stöðu auglýsingar',
      description: 'Failure message when an advert status update fails',
    },
  }),
  rejectAdvert: defineMessages({
    success: {
      id: 'lg.web:toast.rejectAdvert.success',
      defaultMessage: 'Auglýsingu hafnað',
      description: 'Success message when an advert is rejected',
    },
    failure: {
      id: 'lg.web:toast.rejectAdvert.failure',
      defaultMessage: 'Villa kom upp við að hafna auglýsingu',
      description: 'Failure message when an advert rejection fails',
    },
  }),
  publishAdverts: defineMessages({
    success: {
      id: 'lg.web:toast.publishAdverts.success',
      defaultMessage: 'Auglýsingar birtar',
      description: 'Success message when adverts are published',
    },
    failure: {
      id: 'lg.web:toast.publishAdverts.failure',
      defaultMessage: 'Villa kom upp við að birta auglýsingar',
      description: 'Failure message when adverts publishing fails',
    },
  }),
}
