import promiseAll from '@hugsmidjan/qj/promiseAllObject';
import fetch from 'node-fetch';

const getDictionaryFile = async (
  sha: string,
  locale: 'is',
  analyzer: string,
) => {
  return await fetch(
    `https://github.com/island-is/elasticsearch-dictionaries/blob/${sha}/${locale}/${analyzer}.txt?raw=true`,
  )
    .then((response) => response.text())
    .then((response) => {
      if (response) {
        return response.split(/\n/).filter(Boolean);
      } else {
        return [];
      }
    });
};

const domainSpecificStopWords = ['reglugerð'];

export const getSettingsTemplate = async (sha: string, locale: 'is') => {
  const {
    stemmer,
    keywords,
    synonyms,
    stopwords,
    hyphenwhitelist,
    // autocompletestop,
  } = await promiseAll({
    stemmer: getDictionaryFile(sha, locale, 'stemmer'),
    keywords: getDictionaryFile(sha, locale, 'keywords'), // Empty at the moment – 2021-09
    synonyms: getDictionaryFile(sha, locale, 'synonyms'),
    stopwords: getDictionaryFile(sha, locale, 'stopwords').then((words) =>
      words.concat(domainSpecificStopWords),
    ),
    hyphenwhitelist: getDictionaryFile(sha, locale, 'hyphenwhitelist'),
    // autocompletestop: getDictionaryFile(sha, locale, 'autocompletestop'),
  });

  return {
    settings: {
      analysis: {
        filter: {
          icelandicStemmer: {
            type: 'stemmer_override',
            rules: stemmer,
          },
          icelandicStop: {
            type: 'stop',
            stopwords: stopwords,
          },
          icelandicKeyword: {
            type: 'keyword_marker',
            ignore_case: true,
            keywords: keywords,
          },
          icelandicSynonym: {
            type: 'synonym',
            lenient: true,
            synonyms: synonyms,
          },
          icelandicDeCompounded: {
            type: 'dictionary_decompounder',
            word_list: hyphenwhitelist,
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
            // char_filter: ['html_strip'],
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
            // char_filter: ['html_strip'],
          },
          termIcelandic: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'icelandicSynonym', 'icelandicStop'],
          },
        },
      },
    },
  };
};

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
};
