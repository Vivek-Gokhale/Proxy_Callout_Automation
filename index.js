require('dotenv').config(); // Load environment variables from .env
const { chromium } = require('playwright');
const https = require('https');
const url = 'https://assessment.free.beeceptor.com';

// Use environment variables for sensitive information
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error("Email or Password is missing in environment variables. Please set them in the .env file or environment.");
}

const options = {
  headers: {
    'Content-Type': 'application/json'
  }
};

// Validate Content-Type header
if (!options.headers['Content-Type'] || options.headers['Content-Type'] !== 'application/json') {
  throw new Error("Content-Type header is either missing or incorrect. It must be 'application/json'.");
}

(async () => {
  // Launch a Chromium browser instance in non-headless mode
  const browser = await chromium.launch({ 
    headless: false, // Non-headless mode
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the Beeceptor login page
    await page.goto('https://app.beeceptor.com/login');

    // Fill in login credentials and submit the form
    await page.fill('input[name="email"]', EMAIL); // Email input field
    await page.fill('input[name="password"]', PASSWORD); // Password input field
    await page.click('button[type="submit"]'); // Submit button

    // Navigate to the Assessment endpoint page
    await page.goto('https://app.beeceptor.com/console/assessment');
    console.log('Navigated to the Assessment endpoint.');

    // Navigate to the Mocking Rules section
    await page.click('a:has-text("Mocking Rules")');

    // Click on "Additional Rule Types" dropdown to reveal options
    await page.click('text=Additional Rule Types');
    console.log('Opened Additional Rule Types dropdown.');

    // Select "Create Proxy or Callout" from the dropdown
    await page.click('text=Create Proxy or Callout');
    console.log('Navigated to Create Proxy or Callout page.');

    // Step 4: Define Request Matching Criteria
    await page.fill('input[placeholder="e.g: /api/path"]', 'https://assessment.free.beeceptor.com'); // Set the matching path
    console.log('Defined request matching criteria.');

    // Step 5: Configure Synchronous Response Behavior
    await page.selectOption('select[name="behavior"]', 'no-wait'); // Select "no-wait" option
    await page.check('div.col-sm-6 input[type="checkbox"].btn-xs'); // Check the "Wait for callout response" option
    console.log('Set to wait for callout response.');

    // Step 6: Define Asynchronous Request Callout Parameters
    await page.selectOption('#matchMethod', 'POST'); // Set the HTTP method to POST
    await page.fill('#targetEndpoint', 'https://assessment.free.beeceptor.com'); // Define the target endpoint URL
    await page.selectOption('#no-transform', 'transform'); // Choose "Build a custom payload"

    // Save the configured proxy rule
    await page.click("text=Save Proxy");
    console.log('Asynchronous Proxy Rule has been successfully created.');

    // Click on "Create New Rule" to create another rule
    await page.click("text=Create New Rule");

    // Make an HTTPS GET request to the defined URL
    https.get(url, options, (response) => {
      let data = '';

      // Collect response data chunks
      response.on('data', (chunk) => {
        data += chunk;
      });

      // Log the complete response data once the response ends
      response.on('end', () => {
        console.log('Response:', data);
      });
    }).on('error', (error) => {
      console.error("HTTPS Request Error:", error.message); // Log any errors during the request
    });

  } catch (error) {
    console.error("Error occurred:", error.message); // Log errors for debugging
  } finally {
    // Close the browser instance
    await browser.close();
    console.log("Browser closed.");
  }
})();
