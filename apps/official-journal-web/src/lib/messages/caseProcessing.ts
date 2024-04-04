import { defineMessages } from 'react-intl'

export const messages = {
  tabs: defineMessages({
    submitted: {
      id: 'web.page.caseProcessing:tabs.submitted',
      defaultMessage: 'Innsendingar ({count})',
      description: 'Tab label for submitted cases',
    },
    inProgress: {
      id: 'web.page.caseProcessing:tabs.inProgress',
      defaultMessage: 'Grunnvinnsla ({count})',
      description: 'Tab label for cases in progress',
    },
    inReview: {
      id: 'web.page.caseProcessing:tabs.inReview',
      defaultMessage: 'Yfirlestur ({count})',
      description: 'Tab label for cases in review',
    },
    ready: {
      id: 'web.page.caseProcessing:tabs.ready',
      defaultMessage: 'Tilbúið ({count})',
      description: 'Tab label for cases ready',
    },
  }),
  banner: defineMessages({
    title: {
      id: 'web.page.caseProcessing:banner.title',
      defaultMessage: 'Vinnslusvæði Stjórnartíðinda',
      description: 'Title for the banner on the case overview page',
    },
    description: {
      id: 'web.page.caseProcessing:banner.description',
      defaultMessage:
        'Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis',
      description: 'Description for the banner on the case overview page',
    },
  }),
  breadcrumbs: defineMessages({
    home: {
      id: 'web.page.caseProcessing:breadcrumbs.home',
      defaultMessage: 'Stjórnartíðindi',
      description: 'Breadcrumb for the home page',
    },
    cases: {
      id: 'web.page.caseProcessing:breadcrumbs.cases',
      defaultMessage: 'Ritstjórn',
      description: 'Breadcrumb for the case overview page',
    },
  }),
}
