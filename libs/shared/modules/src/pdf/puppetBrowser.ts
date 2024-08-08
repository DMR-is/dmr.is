import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'

export async function getBrowser() {
  if (process.env.NODE_ENV === 'production') {
    return await puppeteerCore.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinting=none',
      ],
      executablePath: '/usr/bin/chromium-browser',
      headless: true,
    })
  } else {
    return await puppeteer.launch({
      executablePath: '/Applications/Chromium.app/Contents/MacOS/Chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinting=none',
      ],
      headless: false,
    })
  }
}
