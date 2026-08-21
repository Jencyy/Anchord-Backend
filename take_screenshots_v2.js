const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting Puppeteer for v2 deep dive...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 } 
  });
  const page = await browser.newPage();
  
  const takeScreenshot = async (name) => {
    await new Promise(r => setTimeout(r, 1500)); // wait for animations/confetti
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
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('Taking initial dashboard screenshot...');
    await takeScreenshot('10_dashboard_initial');

    // Click the first habit row to open details and complete it
    console.log('Clicking first habit...');
    await page.evaluate(() => {
      const rows = document.querySelectorAll('.cursor-pointer');
      // Find a row that is likely a habit item (has check icon or similar inside)
      // Since Sidebar also has cursor-pointer, we narrow it down to the main list area
      const habitRows = Array.from(rows).filter(r => r.closest('.bg-surface') && r.querySelector('button'));
      if(habitRows.length > 0) {
        habitRows[0].click();
      }
    });
    
    console.log('Taking completed habit + details screenshot...');
    await takeScreenshot('11_dashboard_habit_completed');

    // Click it again to trigger 'disrupted' state
    console.log('Clicking habit again to mark disrupted...');
    await page.evaluate(() => {
      const rows = document.querySelectorAll('.cursor-pointer');
      const habitRows = Array.from(rows).filter(r => r.closest('.bg-surface') && r.querySelector('button'));
      if(habitRows.length > 0) {
        habitRows[0].click();
      }
    });
    
    console.log('Taking disrupted habit screenshot...');
    await takeScreenshot('12_dashboard_habit_disrupted');

    // Click Day Off Routine in sidebar
    console.log('Clicking Day Off filter...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dayOffBtn = btns.find(b => b.textContent.includes('Day Off Routine'));
      if (dayOffBtn) dayOffBtn.click();
    });
    
    await takeScreenshot('13_dashboard_day_off');

    // Click Theme toggle
    console.log('Toggling Dark Mode...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      // The theme toggle button is the second button in the header if on desktop
      // Or we can just look for the moon/sun icon wrapper
      const themeBtn = btns.find(b => b.innerHTML.includes('circle cx="12" cy="12" r="4"') || b.innerHTML.includes('M12 3a6 6'));
      if (themeBtn) themeBtn.click();
    });
    
    await takeScreenshot('14_dashboard_dark_mode');

  } catch (error) {
    console.error('Error during screenshot generation:', error);
  } finally {
    await browser.close();
    console.log('Done v2!');
  }
}

run();
