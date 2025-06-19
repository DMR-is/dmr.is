import { defineMessages } from 'react-intl'

export const ritstjornTabMessages = {
  submitted: defineMessages({
    title: {
      id: 'lg.web:ritstjorn-tabs.submitted.title',
      defaultMessage: 'Innsendar ({count})',
      description: 'Label for the tab showing submitted adverts',
    },
  }),
  tobepublished: defineMessages({
    title: {
      id: 'lg.web:ritstjorn-tabs.tobepublished.title',
      defaultMessage: 'Á leið í útgáfu ({count})',
      description: 'Label for the tab showing adverts to be published',
    },
  }),
  overview: defineMessages({
    title: {
      id: 'lg.web:ritstjorn-tabs.overview.title',
      defaultMessage: 'Yfirlit ({count})',
      description: 'Label for the tab showing the overview of adverts',
    },
  }),
}
