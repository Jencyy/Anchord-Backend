const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting Puppeteer for v3 pages...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 } 
  });
  const page = await browser.newPage();
  
  const takeScreenshot = async (name) => {
    await new Promise(r => setTimeout(r, 1500));
    const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved screenshot: ${filePath}`);
  };

  const BASE_URL = 'http://localhost:5173';

  try {
    console.log('Navigating to login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    
    // Login with the credentials user provided
    await page.type('input[name="email"]', 'guj@gmail.com');
    await page.type('input[name="password"]', 'asasas');
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.textContent.toLowerCase().includes('log in') || b.textContent.toLowerCase().includes('sign in'));
      if (loginBtn) loginBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(e => console.log('Wait for nav skipped'));
    await new Promise(r => setTimeout(r, 2000));
    
    // 1. Settings
    console.log('Navigating to Settings...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle0' });
    await takeScreenshot('15_settings_profile');

    // 2. Schedule
    console.log('Navigating to Schedule...');
    await page.goto(`${BASE_URL}/schedule`, { waitUntil: 'networkidle0' });
    await takeScreenshot('16_schedule_builder');

    // 3. Add Habit
    console.log('Navigating to Add Habit...');
    await page.goto(`${BASE_URL}/add-habit`, { waitUntil: 'networkidle0' });
    await takeScreenshot('17_add_habit_empty');
    
    // Trigger AI generation
    console.log('Testing AI generation in Add Habit...');
    await page.type('input[placeholder="e.g., Reading, Hydration"]', 'Meditation');
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aiBtn = btns.find(b => b.textContent.includes('AI Strategy'));
      if (aiBtn) aiBtn.click();
    });
    
    // wait for AI loading to finish
    await new Promise(r => setTimeout(r, 4000));
    await takeScreenshot('18_add_habit_ai_generated');

  } catch (error) {
    console.error('Error during screenshot generation:', error);
  } finally {
    await browser.close();
    console.log('Done v3!');
  }
}

run();
