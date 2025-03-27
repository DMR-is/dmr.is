import puppeteer, { Browser } from 'puppeteer'
import puppeteerCore, { Browser as CoreBrowser } from 'puppeteer-core'

export async function getBrowser(): Promise<Browser | CoreBrowser> {
  const defaultLocalChromiumPath =
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  if (process.env.NODE_ENV === 'production') {
    return await puppeteerCore.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinting=none',
        '--disable-gpu', // https://github.com/puppeteer/puppeteer/issues/12637#issuecomment-2301815579
      ],
      protocolTimeout: 300_000,
      executablePath: '/usr/bin/chromium-browser',
      headless: true,
    })
  } else {
    return await puppeteer.launch({
      executablePath:
        process.env.LOCAL_CHROMIUM_PATH ?? defaultLocalChromiumPath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinting=none',
        '--disable-gpu',
      ],
      headless: true,
    })
  }
}
