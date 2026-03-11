const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3001'); // it's on 3001
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'before-gps.png' });
  
  // change select
  await page.select('select', 'newyork');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'after-gps.png' });
  
  await browser.close();
})();
