// @ts-check
import { test, expect } from '@playwright/test';

const mobileNumber = process.env.WOWSLY_MOBILE;
const otp = process.env.WOWSLY_OTP;

test('authenticated user can create a single-entry single-slot event', async ({ page }) => {
  test.skip(
    !mobileNumber || !otp,
    'Set WOWSLY_MOBILE and WOWSLY_OTP to run the authenticated Wowsly test.'
  );

  await page.goto('https://wowsly.com/');
  await page.getByRole('link', { name: 'Create Event' }).click();

  await expect(page).toHaveURL(/app\.wowsly\.com\/mobile-login/);
  await page.locator('input[name="MobileNumber"]').fill(mobileNumber);
  await page.getByRole('button', { name: 'Get OTP on SMS' }).click();

  await expect(page.getByText(/otp/i).first()).toBeVisible();

  const otpInputs = page.locator('input:visible:not([name="MobileNumber"])');
  if (await otpInputs.count() > 1) {
    const otpDigits = otp.split('');
    for (let index = 0; index < otpDigits.length; index += 1) {
      await otpInputs.nth(index).fill(otpDigits[index]);
    }
  } else {
    await otpInputs.first().fill(otp);
  }

  await page.getByRole('button', { name: /verify|login|submit/i }).click();
  await expect(page).toHaveURL(/app\.wowsly\.com/);

  await page.goto('https://app.wowsly.com/events?type=default');
  await expect(page.getByRole('heading', { name: /create event|event details/i })).toBeVisible();

  await page.getByLabel(/event name/i).fill('Single Entry Single Slot');
  await page.getByRole('radio', { name: /single entry/i }).check();
  await page.getByRole('radio', { name: /single slot/i }).check();
  await page.getByLabel(/event date|date/i).fill('21-09-2026');
  await page.getByLabel(/start time|from time/i).fill('09:00 AM');
  await page.getByLabel(/end time|to time/i).fill('10:00 PM');
  await page.getByLabel(/venue/i).fill('Ahmedabad University');

  await expect(page.getByLabel(/event name/i)).toHaveValue('Single Entry Single Slot');
  await expect(page.getByLabel(/venue/i)).toHaveValue('Ahmedabad University');
});