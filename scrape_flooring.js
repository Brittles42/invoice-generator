const { chromium } = require('playwright');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeFlooring() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  const page = await browser.newPage();
  const ITEM_LIMIT = 20;
  
  try {
    console.log('Starting scrape...');
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Navigate to Home Depot and wait for full page load
    console.log('Navigating to Home Depot...');
    await page.goto('https://www.homedepot.com/b/Flooring/N-5yc1vZaq7r');
    
    // Wait for the main content to load
    console.log('Waiting for page content...');
    await page.waitForLoadState('networkidle');
    await delay(5000); // Wait 5 seconds for dynamic content

    // Try to find products with detailed error logging
    console.log('Looking for product elements...');
    try {
      await page.waitForSelector('[data-testid="product-pod"]', {
        timeout: 60000,
        state: 'visible'
      });
    } catch (error) {
      console.error('Failed to find product elements:', error.message);
      console.log('Current URL:', page.url());
      console.log('Taking screenshot of current page...');
      await page.screenshot({ path: 'debug.png' });
      return;
    }

    const products = await page.$$eval('[data-testid="product-pod"]', 
      (items, limit) => items.slice(0, limit).map(item => ({
        title: item.querySelector('[data-testid="product-title"]')?.innerText?.trim() || '',
        price: item.querySelector('[data-testid="price-format"]')?.innerText?.trim() || '',
        link: item.querySelector('a')?.href || ''
      })), ITEM_LIMIT
    );

    console.log(`Found ${products.length} products to analyze...`);

    // Process each product with delays
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\nProcessing item ${i + 1} of ${products.length}`);
      console.log('Title:', product.title);
      console.log('Price:', product.price);
      
      // Create new page for each product
      const productPage = await browser.newPage();
      try {
        await productPage.goto(product.link, { 
          timeout: 30000,
          waitUntil: 'networkidle'
        });
        
        // Add a small delay after page load
        await delay(2000);

        // Check store availability
        try {
          await productPage.waitForSelector('#store-availability-button', {timeout: 10000});
          await productPage.click('#store-availability-button');
          
          await productPage.waitForSelector('.store-list-container', {timeout: 10000});
          
          const storeStock = await productPage.$$eval('.store-list-container .store-info', stores => {
            return stores.slice(0, 3).map(store => ({
              storeName: store.querySelector('.store-name')?.innerText || '',
              quantity: store.querySelector('.quantity')?.innerText || ''
            }));
          });

          console.log('Store Availability:');
          storeStock.forEach(store => {
            const quantity = store.quantity.match(/\d+/);
            const inStock = quantity ? parseInt(quantity[0]) : 0;
            console.log(`${store.storeName}: ${store.quantity} ${inStock >= 5 ? '(✅ 5+ in stock)' : '❌'}`);
          });

        } catch (error) {
          console.log('Stock information not available for this item');
        }
        
        console.log('Link:', product.link);
        console.log('------------------------');

      } catch (error) {
        console.log(`Error processing product ${i + 1}:`, error.message);
      } finally {
        await productPage.close();
        // Add delay between products (3-5 seconds random delay)
        const randomDelay = Math.floor(Math.random() * 2000) + 3000;
        console.log(`Waiting ${randomDelay}ms before next item...`);
        await delay(randomDelay);
      }
    }

  } catch (error) {
    console.error('Main error:', error);
  } finally {
    console.log('\nScraping complete!');
    await browser.close();
  }
}

// Run the scraper
scrapeFlooring().catch(console.error); 