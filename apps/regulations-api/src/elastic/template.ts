export const getSettingsTemplate = async (logPrefix: string) => {
  const need = (id: string | undefined, name: string) => {
    if (!id)
      throw new Error(`${logPrefix} missing env var for ${name} package id`)
    return `analyzers/${id}`
  }

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
          icelandicStemmer: {
            type: 'stemmer_override',
            rules_path: need(OS_PKG_STEMMER, 'stemmer'),
          },
          icelandicStop: {
            type: 'stop',
            stopwords_path: need(OS_PKG_STOPWORDS, 'stopwords'),
            ignore_case: true,
          },
          icelandicKeyword: {
            type: 'keyword_marker',
            ignore_case: true,
            keywords_path: need(OS_PKG_KEYWORDS, 'keywords'),
          },
          icelandicSynonym: {
            type: 'synonym',
            lenient: true,
            synonyms_path: need(OS_PKG_SYNONYMS, 'synonyms'),
          },
          icelandicDeCompounded: {
            type: 'dictionary_decompounder',
            word_list_path: need(OS_PKG_HYPHEN, 'hyphen whitelist'),
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
