import { defineMessages } from 'react-intl'

export const ritstjornTableMessages = {
  general: defineMessages({
    noDataMessage: {
      id: 'lg.web:ritstjorn-tables.general.noDataMessage',
      defaultMessage: 'Engar auglýsingar fundust, kanski þarf að breyta síu',
      description: 'Message displayed when there are no adverts in the table',
    },
  }),
  publishing: defineMessages({
    removeFromPublishingQueue: {
      id: 'lg.web:ritstjorn-tables.publishing.removeFromPublishingQueue',
      defaultMessage: 'Taka úr útgáfu ${count} {noun}',
      description:
        'Button text for removing an advert from the publishing queue',
    },
    publish: {
      id: 'lg.web:ritstjorn-tables.publishing.publish',
      defaultMessage: 'Gefa út auglýsingar',
      description: 'Button text for publishing adverts',
    },
    publishCount: {
      id: 'lg.web:ritstjorn-tables.publishing.publishCount',
      defaultMessage: 'Gefa út {count} {noun}',
      description: 'Button text showing the count of adverts to publish',
    },
    lastPublished: {
      id: 'lg.web:ritstjorn-tables.publishing.lastPublished',
      defaultMessage: 'Siðast birt',
      description: 'Column header for the last published date',
    },
    nextPublishing: {
      id: 'lg.web:ritstjorn-tables.publishing.nextPublishing',
      defaultMessage: 'Næsta birting',
      description: 'Column header for the next publishing date',
    },
    schedule: {
      id: 'lg.web:ritstjorn-tables.publishing.schedule',
      defaultMessage: 'Áætlun',
      description: 'Column header for the publishing schedule',
    },
    publishingCount: {
      id: 'lg.web:ritstjorn-tables.publishing.publishingCount',
      defaultMessage: 'Fjöldi birtinga',
      description: 'Column header for the count of publications',
    },
    noScheduledDate: {
      id: 'lg.web:ritstjorn-tables.publishing.noScheduledDate',
      defaultMessage: 'Engin útgáfudagsetning skráð',
      description: 'Message when no scheduled date is set',
    },
    noPreviousPublishing: {
      id: 'lg.web:ritstjorn-tables.publishing.noPreviousPublishing',
      defaultMessage: 'Enginn fyrri birting',
      description: 'Message when advert has not been published before',
    },
    yesterday: {
      id: 'lg.web:ritstjorn-tables.publishing.yesterday',
      defaultMessage: 'Í gær',
      description: 'Tag text for yesterday',
    },
    today: {
      id: 'lg.web:ritstjorn-tables.publishing.today',
      defaultMessage: 'Í dag',
      description: 'Tag text for today',
    },
    tomorrow: {
      id: 'lg.web:ritstjorn-tables.publishing.tomorrow',
      defaultMessage: 'Á morgun',
      description: 'Tag text for tomorrow',
    },
    daysAgo: {
      id: 'lg.web:ritstjorn-tables.publishing.daysAgo',
      defaultMessage: 'Fyrir {days} {dative} síðan',
      description: 'Tag text for days ago',
    },
    daysFromNow: {
      id: 'lg.web:ritstjorn-tables.publishing.daysFromNow',
      defaultMessage: 'Eftir {days} daga',
      description: 'Tag text for days in the future',
    },
  }),
  columns: defineMessages({
    scheduledAt: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.scheduledAt',
      defaultMessage: 'Birting',
      description:
        'Column header for the scheduled date of adverts in the submitted table',
    },
    createdAt: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.createdAt',
      defaultMessage: 'Skráning',
      description:
        'Column header for the creation date of adverts in the submitted table',
    },
    publishedAt: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.publishedAt',
      defaultMessage: 'Útgáfa',
      description:
        'Column header for the published date of adverts in the submitted table',
    },
    publishingNumber: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.publishingNumber',
      defaultMessage: 'Útgáfunúmer',
      description:
        'Column header for the publishing number of adverts in the submitted table',
    },
    publishingDate: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.publishingDate',
      defaultMessage: 'Útgáfudagur',
      description:
        'Column header for the publishing date of adverts in the submitted table',
    },
    content: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.content',
      defaultMessage: 'Efni',
      description:
        'Column header for the content of adverts in the submitted table',
    },
    type: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.type',
      defaultMessage: 'Tegund',
      description:
        'Column header for the type of adverts in the submitted table',
    },
    version: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.version',
      defaultMessage: 'Birting',
      description:
        'Column header for the version of adverts in the submitted table',
    },
    category: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.category',
      defaultMessage: 'Flokkur',
      description:
        'Column header for the category of adverts in the submitted table',
    },
    paymentStatus: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.paymentStatus',
      defaultMessage: 'Greiðslustaða',
      description:
        'Column header for the payment status of adverts in the submitted table',
    },
    owner: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.owner',
      defaultMessage: 'Starfs.',
      description:
        'Column header for the employee of adverts in the submitted table',
    },
    sender: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.sender',
      defaultMessage: 'Innsendandi',
      description:
        'Column header for the sender of adverts in the submitted table',
    },
    status: {
      id: 'lg.web:ritstjorn-tables.submitted.columns.status',
      defaultMessage: 'Staða',
      description:
        'Column header for the status of adverts in the submitted table',
    },
  }),
}
