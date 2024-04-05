import { defineMessages } from 'react-intl'

export const messages = {
  general: defineMessages({
    backToPublishing: {
      id: 'web.page.casePublishingOverview:general.backToPublishing',
      defaultMessage: 'Til baka í útgáfu mála',
      description: 'Back to publishing button label for the dashboard',
    },
    publishAllCases: {
      id: 'web.page.casePublishingOverview:general.publishCases',
      defaultMessage: 'Gefa út öll mál',
      description: 'Publish cases button label for the dashboard',
    },
  }),
  breadcrumbs: defineMessages({
    dashboard: {
      id: 'web.page.casePublishingOverview:breadcrumbs.dashboard',
      defaultMessage: 'Stjórnartíðindi',
      description: 'Dashboard breadcrumb for the dashboard',
    },
    casePublishing: {
      id: 'web.page.casePublishingOverview:breadcrumbs.casePublishing',
      defaultMessage: 'Útgáfa mála',
      description: 'Case publishing breadcrumb for the dashboard',
    },
  }),
  banner: defineMessages({
    title: {
      id: 'web.page.casePublishingOverview:banner.title',
      defaultMessage: 'Útgáfa mála',
      description: 'Dashboard banner title for the dashboard',
    },
    description: {
      id: 'web.page.casePublishingOverview:banner.description',
      defaultMessage:
        'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      description: 'Dashboard banner description for the dashboard',
    },
  }),
  notifications: {
    warning: defineMessages({
      title: {
        id: 'web.page.casePublishingOverview:notifications.warning.title',
        defaultMessage: 'Mál til útgáfu',
        description: 'Warning notification title',
      },
      message: {
        id: 'web.page.casePublishingOverview:notifications.warning.message',
        defaultMessage:
          'Vinsamlegast farðu yfir og staðfestu eftirfarandi lista mála til birtingar.',
        description: 'Warning notification message',
      },
    }),
    success: defineMessages({
      title: {
        id: 'web.page.casePublishingOverview:notifications.success.title',
        defaultMessage: 'Útgáfa mála heppnaðist',
        description: 'Success notification title',
      },
      message: {
        id: 'web.page.casePublishingOverview:notifications.success.message',
        defaultMessage: 'Málin eru nú orðin sýnileg á ytri vef.',
        description: 'Success notification message',
      },
    }),
  },
}
