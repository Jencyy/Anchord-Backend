const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting Puppeteer...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 } 
  });
  const page = await browser.newPage();
  
  const takeScreenshot = async (name) => {
    // wait a bit for any animations
    await new Promise(r => setTimeout(r, 1000));
    const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved screenshot: ${filePath}`);
  };

  const BASE_URL = 'http://localhost:5173';

  try {
    console.log('Navigating to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await takeScreenshot('01_login');

    console.log('Navigating to signup...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
    await takeScreenshot('02_signup');

    console.log('Navigating to forgot password...');
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle0' });
    await takeScreenshot('03_forgot_password');

    // Create a new user to capture Onboarding
    console.log('Creating a new user for onboarding capture...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
    await page.type('input[name="name"]', 'Onboarding Test');
    await page.type('input[name="email"]', `onboarding_${Date.now()}@example.com`);
    await page.type('input[name="password"]', 'password123');
    
    // Find the submit button and click it
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submitBtn = btns.find(b => b.textContent.includes('Sign Up') || b.textContent.includes('Create'));
      if(submitBtn) submitBtn.click();
    });
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(e => console.log('Wait for nav skipped'));
    await new Promise(r => setTimeout(r, 2000));
    console.log('Current URL:', page.url());
    await takeScreenshot('04_onboarding_step1');

    // Proceed to Dashboard with the seeded user
    console.log('Logging in with seeded user...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    
    // We might have a slightly different DOM, so trying a robust way
    await page.type('input[name="email"]', 'test_figma@example.com');
    await page.type('input[name="password"]', 'password123');
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.textContent.toLowerCase().includes('log in') || b.textContent.toLowerCase().includes('sign in'));
      if (loginBtn) loginBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(e => console.log('Wait for nav skipped'));
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('Taking Dashboard screenshot...');
    await takeScreenshot('05_dashboard_habits');

    console.log('Taking Schedule View screenshot...');
    await page.goto(`${BASE_URL}/schedule`, { waitUntil: 'networkidle0' });
    await takeScreenshot('06_dashboard_schedule');

    console.log('Taking Settings View screenshot...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle0' });
    await takeScreenshot('07_dashboard_settings');
    
    console.log('Taking Add Habit View screenshot...');
    await page.goto(`${BASE_URL}/add-habit`, { waitUntil: 'networkidle0' });
    await takeScreenshot('08_add_habit');

  } catch (error) {
    console.error('Error during screenshot generation:', error);
  } finally {
    await browser.close();
    console.log('Done!');
  }
}

run();
