import { QueryParams } from './constants'

export const MOCK_FILTERS = [
  {
    title: 'Birting',
    queryParam: QueryParams.PUBLICATION,
    options: [
      {
        label: 'Mín mál',
        value: 'min-mal',
      },
      {
        label: 'Mál sem bíða svara',
        value: 'mal-sem-bida-svara',
      },
    ],
  },
  {
    title: 'Tegund',
    queryParam: QueryParams.TYPE,
    options: [
      {
        label: 'Lög',
        value: 'log',
      },
      {
        label: 'Reglugerð',
        value: 'reglugerd',
      },
      {
        label: 'Auglýsing',
        value: 'auglysing',
      },
      {
        label: 'Reglur',
        value: 'reglur',
      },
    ],
  },
  {
    title: 'Flokkur',
    queryParam: QueryParams.CATEGORY,
    options: [
      {
        label: 'Dómsbirting',
        value: 'domsbirting',
      },
      {
        label: 'Firmaskrá',
        value: 'firmaskra',
      },
      {
        label: 'Fyrirkall',
        value: 'fyrirkall',
      },
      {
        label: 'Innköllun þrotabú',
        value: 'innkollun-throtabu',
      },
      {
        label: 'Skiptalok',
        value: 'skiptalok',
      },
    ],
  },
]
