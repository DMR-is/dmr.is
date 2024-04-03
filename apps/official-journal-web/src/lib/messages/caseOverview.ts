import { defineMessages } from 'react-intl'

export const messages = {
  tabs: defineMessages({
    submitted: {
      id: 'web.caseOverview.tabs.submitted',
      defaultMessage: 'Innsendingar {count}',
      description: 'Tab label for submitted cases',
    },
    inProgress: {
      id: 'web.caseOverview.tabs.inProgress',
      defaultMessage: 'Grunnvinnsla {count}',
      description: 'Tab label for cases in progress',
    },
    inReview: {
      id: 'web.caseOverview.tabs.inReview',
      defaultMessage: 'Yfirlestur {count}',
      description: 'Tab label for cases in review',
    },
    ready: {
      id: 'web.caseOverview.tabs.ready',
      defaultMessage: 'Tilbúið {count}',
      description: 'Tab label for cases ready',
    },
  }),
  banner: defineMessages({
    title: {
      id: 'web.caseOverview.banner.title',
      defaultMessage: 'Vinnslusvæði Stjórnartíðinda',
      description: 'Title for the banner on the case overview page',
    },
    description: {
      id: 'web.caseOverview.banner.description',
      defaultMessage:
        'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis',
      description: 'Description for the banner on the case overview page',
    },
  }),
  breadcrumbs: defineMessages({
    home: {
      id: 'web.caseOverview.breadcrumbs.home',
      defaultMessage: 'Stjórnartíðindi',
      description: 'Breadcrumb for the home page',
    },
    cases: {
      id: 'web.caseOverview.breadcrumbs.cases',
      defaultMessage: 'Ritstjórn',
      description: 'Breadcrumb for the case overview page',
    },
  }),
}
