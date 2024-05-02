import { writeFileSync } from 'fs'
import path from 'path'
import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'

import { Test } from '@nestjs/testing'

import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

const MOCK_HTML = `<p>\nSé\nmunur\ná\nuppsetningu\ntexta\nhér\nað\nneðan\nog\ní\nPDF\nskjali\ngildir\nPDF\nskjalið.<br />\n<a href=\"PdfVersions.aspx?recordId=749f1eff-236d-4c67-a4cc-eb7a7bbd373f\"><img src=\"Images/pdf.gif\" />\n1278/2023</a>\n</p>\n\n<table>\n\n<tbody>\n\n<tr>\n\n<td>\nNr.\n1278/2023\n</td>\n\n<td align=\"right\">\n15.\nnóvember\n2023\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n<p>\nGJALDSKRÁ\n</p>\n\n<p>\nfyrir\nhundahald\ní\nReykjavíkurborg.\n</p>\n\n<h3 class=\"article__title\">\n1.\ngr.\n</h3>\n\n<p>\nAf\nhundum\ní\nReykjavíkurborg\nskal\nDýraþjónusta\nReykjavíkur\ninnheimta\ngjöld\nsamkvæmt\ngjaldskrá\nþessari,\nsem\nætlað\ner\nað\nstandi\nundir\nkostnaði\nvið\nframkvæmd\nsamþykktar\num\nhundahald\ní\nReykjavíkurborg\nnr.\n355/2022.\n</p>\n\n<h3 class=\"article__title\">\n2.\ngr.\n</h3>\n\n<p>\nAf\nhundum\ní\nReykjavíkurborg\nskal\ninnheimta\nárlegt\nþjónustu-\nog\neftirlitsgjald,\nhundagjald,\nsamkvæmt\nsamþykkt\num\nhundahald\ní\nReykjavíkurborg\nárið\neftir\nað\nhundur\ner\nskráður\ní\nfyrsta\nsinn\nog\nsíðan\nárlega\neftir\nþað.\nEkkert\ngjald\ner\ninnheimt\nvið\nskráningu\nhunds.\n</p>\n\n<table class=\"layout\">\n\n<tbody>\n\n<tr>\n\n<td>\nÁrlegt\nhundagjald\n</td>\n\n<td align=\"center\">\nkr.\n</td>\n\n<td align=\"right\">\n17.200\n</td>\n\n</tr>\n\n<tr>\n\n<td>\nSkráningargjald\n</td>\n\n<td align=\"center\">\nkr.\n</td>\n\n<td align=\"right\">\n0\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n<p>\nSkrá\nskal\nalla\nhunda\ní\nReykjavíkurborg,\neinnig\nþá\nsem\nundanþegnir\neru\nárlegu\nhundagjaldi\nsamkvæmt\nsamþykkt\num\nhundahald\ní\nReykjavíkurborg.\n</p>\n\n<h3 class=\"article__title\">\n3.\ngr.\n</h3>\n\n<p>\nHeimilt\ner\nað\nveita\nallt\nað\n30%\nafslátt\naf\nárlegu\ngjaldi\nhafi\nviðkomandi\nhundaeigandi\nsótt\nnámskeið\num\nhundahald\nsem\nviðurkennt\ner\naf\nDýraþjónustu\nReykjavíkur.\n</p>\n\n<h3 class=\"article__title\">\n4.\ngr.\n</h3>\n\n<p>\nVið\nafhendingu\nhandsamaðs\nóskráðs\nhunds\nber\nað\ninnheimta\nkr.\n37.230\nhandsömunargjald.\nAð\nauki\nskal\neigandi\ngreiða\nþann\nkostnað\nsem\nfellur\ntil\nvegna\ndvalar\neða\ngeymslu\nviðkomandi\nhunds.\nVið\nafhendingu\nhandsamaðs\nhunds,\nsem\nskráður\ner\ní\nReykjavíkurborg\neða\nhjá\nöðru\nsveitarfélagi,\nskal\neinungis\ninnheimtur\nsá\nkostnaður\nsem\nfallið\nhefur\ntil\nvegna\ndvalar\nog\ngeymslu\nviðkomandi\nhunds.\nHafi\nskráður\nhundur\nverið\nhandsamaður\nþrisvar\nsinnum\neða\noftar\nskal\neigandi\nþó\ngreiða\nhandsömunargjald\nsem\nog\nkostnað\nvegna\ndvalar\nog\ngeymslu\nviðkomandi\nhunds.\n</p>\n\n<h3 class=\"article__title\">\n5.\ngr.\n</h3>\n\n<p>\nGjalddagi\nsamkvæmt\n2.\nog\n3.\ngr.\ner\n1.\nmars\nog\neindagi\n1.\nmaí\nár\nhvert.\nDráttarvextir\nreiknast\nfrá\ngjalddaga\nséu\ngjöldin\nekki\ngreidd\ná\neindaga.\nUm\ninnheimtu\ngjalda\nfer\nsamkvæmt\n59.\ngr.\nlaga\nnr.\n7/1998\num\nhollustuhætti\nog\nmengunarvarnir.\n</p>\n\n<h3 class=\"article__title\">\n6.\ngr.\n</h3>\n\n<p>\nGjaldskrá\nþessi\nsem\nsamin\ner\nog\nsamþykkt\naf\nborgarstjórn\nReykjavíkur\n7.\nnóvember\n2023,\nmeð\nheimild\ní\n5.\nmgr.\n59.\ngr.\nlaga\nnr.\n7/1998\num\nhollustuhætti\nog\nmengunarvarnir,\nmeð\nsíðari\nbreytingum\nog\n24.\ngr.\nlaga\nnr.\n55/2013\num\nvelferð\ndýra\nstaðfestist\nhér\nmeð\nog\nöðlast\ngildi\n1.\njanúar\n2024.\nUm\nleið\nfellur\núr\ngildi\ngjaldskrá\nsama\nefnis\nnr.\n999/2023.\n</p>\n\n<p align=\"center\">\n<em>Borgarstjórinn\ní\nReykjavík,\n15.\nnóvember\n2023.</em>\n</p>\n\n<p align=\"center\">\n<strong>Dagur\nB.\nEggertsson.</strong>\n</p>\n\n<p align=\"center\">\n<strong>B\ndeild\n-\nÚtgáfud.:\n29.\nnóvember\n2023</strong>\n</p>\n`

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('PdfService', () => {
  let service: IPdfService

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: IPdfService,
          useClass: PdfService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile()

    service = app.get<IPdfService>(IPdfService)
  })

  describe('generatePdfFromHTML', () => {
    it('should return a Buffer', async () => {
      const retries = 10
      let tries = 0
      let pdf = null

      const wait = async (ms: number) => {
        await sleep(ms)
      }

      while (tries < retries) {
        try {
          console.log('try number', tries)
          await wait(1000)
          pdf = await service.generatePdfFromHtml(MOCK_HTML, true)
          writeFileSync(path.join(__dirname, '/test.pdf'), pdf)
          break
        } catch (error) {
          console.log('error', error)
          tries++
        }
      }

      if (tries === retries) {
        throw new Error('Failed to generate PDF')
      }

      expect(pdf).toBeInstanceOf(Buffer)
    })
  })
})
