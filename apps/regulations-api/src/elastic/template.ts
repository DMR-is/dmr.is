export const getSettingsTemplate = async (logPrefix: string) => {
  const need = (id: string | undefined, name: string) => {
    if (!id)
      throw new Error(`${logPrefix} missing env var for ${name} package id`)
    return `analyzers/${id}`
  }

  const STEMMER_PKG = process.env.OS_PKG_STEMMER || 'F203129716'
  const STOPWORDS_PKG = process.env.OS_PKG_STOPWORDS || 'F167171114'
  const KEYWORDS_PKG = process.env.OS_PKG_KEYWORDS || 'F24967943'
  const SYNONYMS_PKG = process.env.OS_PKG_SYNONYMS || 'F256679733'
  const HYPHEN_PKG = process.env.OS_PKG_HYPHEN || 'F22901080'
  return {
    settings: {
      analysis: {
        filter: {
          icelandicStemmer: {
            type: 'stemmer_override',
            rules_path: need(STEMMER_PKG, 'stemmer'),
          },
          icelandicStop: {
            type: 'stop',
            stopwords_path: need(STOPWORDS_PKG, 'stopwords'),
            ignore_case: true,
          },
          icelandicKeyword: {
            type: 'keyword_marker',
            ignore_case: true,
            keywords_path: need(KEYWORDS_PKG, 'keywords'),
          },
          icelandicSynonym: {
            type: 'synonym', // use 'synonym_graph' if preferred for multi-word
            lenient: true,
            synonyms_path: need(SYNONYMS_PKG, 'synonyms'),
          },
          icelandicDeCompounded: {
            type: 'dictionary_decompounder',
            word_list_path: need(HYPHEN_PKG, 'hyphen whitelist'),
            max_subword_size: 18,
            min_subword_size: 4,
          },
        },
        analyzer: {
          baseIcelandic: {
            type: 'custom',
            tokenizer: 'standard',
            filter: [
              'lowercase',
              'icelandicSynonym',
              'icelandicStop',
              'icelandicKeyword',
              'icelandicStemmer',
            ],
          },
          compoundIcelandic: {
            type: 'custom',
            tokenizer: 'standard',
            filter: [
              'lowercase',
              'icelandicSynonym',
              'icelandicStop',
              'icelandicKeyword',
              'icelandicDeCompounded',
              'icelandicStemmer',
            ],
          },
          termIcelandic: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'icelandicSynonym', 'icelandicStop'],
          },
        },
      },
    },
  }
}

export const mappingTemplate = {
  properties: {
    name: {
      type: 'text',
    },
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
    text: {
      type: 'text',
      fields: {
        stemmed: {
          type: 'text',
          analyzer: 'baseIcelandic',
        },
      },
    },
    year: {
      type: 'keyword',
    },
    type: {
      type: 'keyword',
    },
    publishedDate: {
      type: 'date',
    },
    repealedDate: {
      type: 'date',
    },
    repealed: {
      type: 'boolean',
    },
    ministry: {
      type: 'text',
    },
    ministrySlug: {
      type: 'keyword',
    },
    lawChapters: {
      type: 'text',
    },
    lawChaptersSlugs: {
      type: 'keyword',
    },
  },
}
