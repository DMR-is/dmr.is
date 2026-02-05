export function getAdvertSettingsTemplate() {
  const {
    OS_PKG_STEMMER,
    OS_PKG_STOPWORDS,
    OS_PKG_KEYWORDS,
    OS_PKG_SYNONYMS,
    OS_PKG_HYPHEN,
  } = process.env

  return {
    settings: {
      analysis: {
        filter: {
          is_stem: {
            type: 'stemmer_override',
            rules_path: `analyzers/${OS_PKG_STEMMER}`,
          },
          is_stop: {
            type: 'stop',
            stopwords_path: `analyzers/${OS_PKG_STOPWORDS}`,
            ignore_case: true,
          },
          is_kw: {
            type: 'keyword_marker',
            ignore_case: true,
            keywords_path: `analyzers/${OS_PKG_KEYWORDS}`,
          },
          is_syn: {
            type: 'synonym',
            lenient: true,
            synonyms_path: `analyzers/${OS_PKG_SYNONYMS}`,
          },
          is_decomp: {
            type: 'dictionary_decompounder',
            word_list_path: `analyzers/${OS_PKG_HYPHEN}`,
            max_subword_size: 18,
            min_subword_size: 4,
          },
        },
        analyzer: {
          baseIcelandic: {
            type: 'custom',
            tokenizer: 'standard',
            char_filter: ['html_strip'],
            filter: ['lowercase', 'is_syn', 'is_stop', 'is_kw', 'is_stem'],
          },
          compoundIcelandic: {
            type: 'custom',
            tokenizer: 'standard',
            char_filter: ['html_strip'],
            filter: [
              'lowercase',
              'is_syn',
              'is_stop',
              'is_kw',
              'is_decomp',
              'is_stem',
            ],
          },
          termIcelandic: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'is_syn', 'is_stop'],
          },
        },
      },
    },
  }
}

export const advertMappingTemplate = {
  _source: { excludes: ['bodyText'] }, // exclude html text from response. Smaller payload.
  properties: {
    id: { type: 'keyword' },
    title: {
      type: 'text',
      fields: {
        stemmed: {
          type: 'text',
          analyzer: 'baseIcelandic',
        },
        compound: {
          type: 'text',
          analyzer: 'compoundIcelandic',
        },
        keyword: {
          type: 'keyword',
        },
      },
    },
    department: {
      type: 'object',
      properties: {
        id: { type: 'keyword' },
        slug: { type: 'keyword' },
        title: {
          type: 'text',
          fields: {
            stemmed: { type: 'text', analyzer: 'baseIcelandic' },
            compound: { type: 'text', analyzer: 'compoundIcelandic' },
            keyword: { type: 'keyword' },
          },
        },
      },
    },
    type: {
      type: 'object',
      properties: {
        id: { type: 'keyword' },
        slug: { type: 'keyword' },
        title: {
          type: 'text',
          fields: {
            stemmed: { type: 'text', analyzer: 'baseIcelandic' },
            compound: { type: 'text', analyzer: 'compoundIcelandic' },
            keyword: { type: 'keyword' },
          },
        },
      },
    },
    subject: { type: 'text' },
    status: { type: 'keyword' },
    publicationNumber: {
      type: 'object',
      properties: {
        full: { type: 'keyword' },
        number: { type: 'keyword' },
        year: { type: 'keyword' },
      },
    },
    publicationDate: { type: 'date' },
    involvedParty: {
      type: 'object',
      properties: {
        slug: { type: 'keyword' },
        title: {
          type: 'text',
          fields: {
            stemmed: { type: 'text', analyzer: 'baseIcelandic' },
            compound: { type: 'text', analyzer: 'compoundIcelandic' },
            keyword: { type: 'keyword' },
          },
        },
      },
    },
    categories: {
      type: 'object',
      properties: {
        id: { type: 'keyword' },
        slug: { type: 'keyword' },
        title: {
          type: 'text',
          fields: {
            stemmed: { type: 'text', analyzer: 'baseIcelandic' },
            compound: { type: 'text', analyzer: 'compoundIcelandic' },
            keyword: { type: 'keyword' },
          },
        },
        mainCategories: {
          type: 'object',
          properties: {
            id: { type: 'keyword' },
            slug: { type: 'keyword' },
            title: {
              type: 'text',
              fields: {
                stemmed: { type: 'text', analyzer: 'baseIcelandic' },
                compound: { type: 'text', analyzer: 'compoundIcelandic' },
                keyword: { type: 'keyword' },
              },
            },
            description: {
              type: 'text',
              fields: {
                stemmed: { type: 'text', analyzer: 'baseIcelandic' },
                compound: { type: 'text', analyzer: 'compoundIcelandic' },
                keyword: { type: 'keyword' },
              },
            },
          },
        },
      },
    },
    caseNumber: { type: 'keyword' },
    bodyText: {
      type: 'text',
      fields: {
        stemmed: {
          type: 'text',
          analyzer: 'baseIcelandic',
        },
      },
    },
    // TODO: Bæta við viðaukum síðar.
  },
}
