import { defineMessages } from 'react-intl'

export const messages = {
  grunnvinnsla: defineMessages({
    group1title: {
      id: 'web.components.steps.grunnvinnsla:group1title',
      defaultMessage: 'Almennt um málið',
      description: '',
    },
    institution: {
      id: 'web.components.steps.grunnvinnsla:institution',
      defaultMessage: 'Sendandi',
      description: '',
    },
    subject: {
      id: 'web.components.steps.grunnvinnsla:title',
      defaultMessage: 'Heiti auglýsingar',
      description: '',
    },
    department: {
      id: 'web.components.steps.grunnvinnsla:department',
      defaultMessage: 'Deild',
      description: '',
    },
    type: {
      id: 'web.components.steps.grunnvinnsla:type',
      defaultMessage: 'Tegund',
      description: '',
    },
    categories: {
      id: 'web.components.steps.grunnvinnsla:categories',
      defaultMessage: 'Efnisflokkar',
      description: '',
    },
    group2title: {
      id: 'web.components.steps.grunnvinnsla:group2title',
      defaultMessage: 'Birting',
      description: '',
    },
    createdDate: {
      id: 'web.components.steps.grunnvinnsla:createdDate',
      defaultMessage: 'Dagsetning innsendingar',
      description: '',
    },
    publicationDate: {
      id: 'web.components.steps.grunnvinnsla:publicationDate',
      defaultMessage: 'Dagsetning birtingar',
      description: '',
    },
    fastTrack: {
      id: 'web.components.steps.grunnvinnsla:fastTrack',
      defaultMessage: 'Óskað er eftir hraðbirtingu',
      description: '',
    },
    price: {
      id: 'web.components.steps.grunnvinnsla:price',
      defaultMessage: 'Áætlað verð',
      description: '',
    },
    paid: {
      id: 'web.components.steps.grunnvinnsla:paid',
      defaultMessage: 'Búið er að greiða',
      description: '',
    },
    attachments: {
      id: 'web.components.steps.grunnvinnsla:attachments',
      defaultMessage: 'Fylgiskjöl',
      description: '',
    },
  }),
  yfirlestur: defineMessages({
    group1title: {
      id: 'web.components.steps.yfirlestur:group1title',
      defaultMessage: 'Meginmál',
      description: '',
    },
    tag: {
      id: 'web.components.steps.yfirlestur:tag',
      defaultMessage: 'Merking',
      description: '',
    },
  }),

  tilbuid: defineMessages({
    group1title: {
      id: 'web.components.steps.tilbuid:group1title',
      defaultMessage: 'Meginmál',
      description: '',
    },
  }),

  leidretting: defineMessages({
    warningRejectTitle: {
      id: 'web.components.steps.leidretting:warningRejectTitle',
      defaultMessage: 'ATH! Mál er hafnað',
    },
    warningRejectMessage: {
      id: 'web.components.steps.leidretting:warningRejectMessage',
      defaultMessage:
        'Málum sem er hafnað er ekki breytt og þeim fylgir athugasemd sem undirstrikar hvers vegna málinu var hafnað',
    },
    warningTitle: {
      id: 'web.components.steps.leidretting:warningTitle',
      defaultMessage: 'ATH! Mál er útgefið',
    },
    warningMessage: {
      id: 'web.components.steps.leidretting:warningMessage',
      defaultMessage:
        'Málum sem er breytt eftir útgáfu eru leiðrétt á ytri vef og þeim fylgir athugasemd sem undirstrikar breytingar',
    },
    errorFetching: {
      id: 'web.components.steps.leidretting:errorFetching',
      defaultMessage: 'Villa við að sækja gögn',
    },
    errorFetchingMessage: {
      id: 'web.components.steps.leidretting:errorFetchingMessage',
      defaultMessage:
        'Ekki tókst að sækja gögn um málið, vinsamlegast reyndu aftur síðar',
    },
    noData: {
      id: 'web.components.steps.leidretting:noData',
      defaultMessage: 'Engin gögn',
    },
    noDataMessage: {
      id: 'web.components.steps.leidretting:noDataMessage',
      defaultMessage: 'Engin gögn fundust um málið',
    },
  }),
}
