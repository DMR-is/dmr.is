import { RegName } from '@island.is/regulations-tools/types'

// import { DRAFTS_FOLDER, FILE_SERVER, MEDIA_BUCKET_FOLDER } from '../constants'

import { _fileUrlsMapper } from './file-upload-urls'

const defaultRegName = '0123/2004' as RegName
const regulationDraftId = '0cb3a68b-f368-4d01-a594-ba73e0dc396d'

// ---------------------------------------------------------------------------

// ALL TESTS WILL BE SKIPPED FOR NOW
// TODO: ADD TESTS and ENV VARS BACK IN WHEN FILE UPLOAD FUNCTIONALITY IS RE-ENABLED
const DRAFTS_FOLDER = ''
const FILE_SERVER = ''
const MEDIA_BUCKET_FOLDER = ''

const devPrefix = MEDIA_BUCKET_FOLDER ? MEDIA_BUCKET_FOLDER + '/' : ''

type TestProps = Array<{
  url: string
  key: string | undefined
}>

const testMapping = (tests: TestProps, regName: RegName = defaultRegName) => {
  const urls = tests.map((t) => t.url)

  const expected = tests
    .filter((t): t is { url: string; key: string } => !!t.key)
    .map((t) => ({
      old: t.url,
      new: FILE_SERVER + '/' + devPrefix + 'files/' + regName + '/' + t.key,
    }))

  // run the test
  expect(
    _fileUrlsMapper(urls, regName, true).map((m) => ({
      old: m.oldUrl,
      new: m.newUrl,
    })),
  ).toEqual(expected)
}

// ---------------------------------------------------------------------------

describe.skip('_makeFileKey', () => {
  it('ignores empty strings', () => {
    testMapping([
      {
        url: '',
        key: undefined,
      },
    ])
  })

  it('ignores URLs already published on the file-server', () => {
    // Ignored/unchanged URLs are not returned as they've already been uploaded
    // and there's no need to replace/update/rewrite them in a HTML text.
    testMapping([
      {
        url: FILE_SERVER + '/files/2021/0123/barchart.png',
        key: undefined,
      },
      {
        url: FILE_SERVER + '/foobar/document.pdf',
        key: undefined,
      },
      {
        url: FILE_SERVER + '/media/file.jpg',
        key: undefined,
      },
      {
        url: FILE_SERVER + '/stjornartidindi/foobar.aspx__q__blah',
        key: undefined,
      },
      {
        url: FILE_SERVER + '/ext/www.somedomain.com/image.jpg',
        key: undefined,
      },
    ])
  })

  it('maps URLs to a folder named after the domain name', () => {
    testMapping([
      {
        url: 'https://www.somedomain.com/image.jpg',
        key: 'www.somedomain.com/image.jpg',
      },
      {
        // squashes querystrings into the path/filename
        url: 'https://www.stjornartidindi.is/foobar.aspx?blah&blah',
        key: 'www.stjornartidindi.is/foobar.aspx__q__blah&blah',
      },
      {
        // deals with weird double-querystring urls
        url: 'https://doublequery.is/foobar.aspx?blah&blah?weirdbutok',
        key: 'doublequery.is/foobar.aspx__q__blah&blah__q__weirdbutok',
      },
      {
        // preserves port numbers
        url: 'https://www.foo.bar:4430/gif.gif',
        key: 'www.foo.bar:4430/gif.gif',
      },
      {
        // new URL() strips port :433 off https urls
        url: 'https://www.foo.bar:443/gif.gif',
        key: 'www.foo.bar/gif.gif',
      },
      {
        // accepts old insecure http:// urls
        url: 'http://www.blah.is/resource.png',
        key: 'www.blah.is/resource.png',
      },
    ])
  })

  it('special-case treats URLs starting with "/" as www.reglugerd.is URLs', () => {
    testMapping([
      {
        url: '/media/funny.gif',
        key: 'www.reglugerd.is/media/funny.gif',
      },
      {
        url: '/someDocument.pdf',
        key: 'www.reglugerd.is/someDocument.pdf',
      },
    ])
  })

  it('detects draft-documents on the file-server and moves them to a public folder', () => {
    const fileServerDraft =
      FILE_SERVER + '/' + DRAFTS_FOLDER + '/' + regulationDraftId + '/'

    // Ignored/unchanged URLs are not returned as they've already been uploaded
    // and there's no need to replace/update/rewrite them in a HTML text.
    testMapping([
      {
        url: fileServerDraft + 'files/2021/0123/barchart.png',
        key: 'files/2021/0123/barchart.png',
      },
      {
        url: fileServerDraft + 'foobar/document.pdf',
        key: 'foobar/document.pdf',
      },
      {
        url: fileServerDraft + 'media/file.jpg',
        key: 'media/file.jpg',
      },
      {
        url: fileServerDraft + 'stjornartidindi/foobar.aspx__q__blah',
        key: 'stjornartidindi/foobar.aspx__q__blah',
      },
      {
        url: fileServerDraft + 'ext/www.somedomain.com/image.jpg',
        key: 'ext/www.somedomain.com/image.jpg',
      },
    ])
  })

  it('grudgingly accepts draft-documents that do not have a draftId scope folder by accident', () => {
    const fileServerDraftNoUUIDScope = FILE_SERVER + '/' + DRAFTS_FOLDER + '/'

    testMapping([
      {
        url: fileServerDraftNoUUIDScope + 'my-uploaded-barchart.png',
        key: 'my-uploaded-barchart.png',
      },
      {
        // Folder goes missing. Weir, but mostly harmless.
        url:
          fileServerDraftNoUUIDScope +
          'this-folder-goes-missing/weird-but-ok/my-uploaded-barchart.png',
        key: 'weird-but-ok/my-uploaded-barchart.png',
      },
    ])
  })
})
