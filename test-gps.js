async function run() {
  const puppeteerModule = await import('puppeteer')
  const puppeteer = puppeteerModule.default

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto('http://localhost:3001')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'before-gps.png' })

  await page.select('select', 'newyork')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'after-gps.png' })

  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
