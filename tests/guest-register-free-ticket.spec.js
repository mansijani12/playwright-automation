// @ts-check
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';

const mobileNumber = process.env.WOWSLY_MOBILE;
const otp = process.env.WOWSLY_OTP;
const guestName = process.env.WOWSLY_GUEST_NAME ?? 'Guest One';
const guestMobile = process.env.WOWSLY_GUEST_MOBILE ?? '9999999999';
const guestEmail = process.env.WOWSLY_GUEST_EMAIL ?? 'guest@example.com';
const guestPhoto = process.env.WOWSLY_GUEST_PHOTO ?? path.join(process.env.USERPROFILE ?? '', 'Downloads', 'post.png');
const secondHolderName = process.env.WOWSLY_TICKET_HOLDER_2_NAME ?? 'Guest Two';
const secondHolderMobile = process.env.WOWSLY_TICKET_HOLDER_2_MOBILE ?? '9999999998';
const secondHolderEmail = process.env.WOWSLY_TICKET_HOLDER_2_EMAIL ?? guestEmail;
const secondHolderPhoto = process.env.WOWSLY_TICKET_HOLDER_2_PHOTO ?? guestPhoto;

test('registers a guest and assigns one Single Entry Normal free ticket', async ({ page }) => {
  test.skip(
    !mobileNumber || !otp || !existsSync(guestPhoto) || !existsSync(secondHolderPhoto),
    'Set WOWSLY_MOBILE and WOWSLY_OTP, and ensure the guest photo files exist.'
  );

  await page.goto('https://wowsly.com/');
  await page.getByRole('link', { name: 'Create Event' }).click();
  await expect(page).toHaveURL(/app\.wowsly\.com\/mobile-login/);

  await page.locator('input[name="MobileNumber"]').fill(mobileNumber ?? '');
  await page.getByRole('button', { name: 'Get OTP on SMS' }).click();
  await expect(page.getByText(/otp/i).first()).toBeVisible();

  const otpInputs = page.locator('input:visible:not([name="MobileNumber"])');
  if (await otpInputs.count() > 1) {
    for (const [index, digit] of (otp ?? '').split('').entries()) {
      await otpInputs.nth(index).fill(digit);
    }
  } else {
    await otpInputs.first().fill(otp ?? '');
  }

  await page.getByRole('button', { name: /verify|login|submit/i }).click();
  await expect(page).toHaveURL(/app\.wowsly\.com/);

  await page.goto('https://app.wowsly.com/e/3201/test-group-pass-29-09');
  await page.getByRole('tab', { name: 'Registration' }).click();

  const guestFields = page.getByRole('textbox');
  await guestFields.nth(0).fill(guestName);
  await guestFields.nth(1).fill(guestMobile);
  await guestFields.nth(2).fill(guestEmail);
  await page.locator('input[type="file"]').setInputFiles(guestPhoto);

  let imageEditor = page.getByRole('dialog', { name: /Edit Image/ });
  await imageEditor.getByRole('button', { name: 'Save' }).click();
  await imageEditor.waitFor({ state: 'hidden' });

  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Select Tickets' })).toBeVisible();
  await page.getByRole('button', { name: /Single Entry Normal Free Entry for 2 people/ }).click();

  await page.getByRole('textbox', { name: 'Name' }).fill(secondHolderName);
  await page.getByRole('textbox', { name: 'Mobile number' }).fill(secondHolderMobile);
  await page.getByRole('textbox', { name: 'Email' }).fill(secondHolderEmail);
  await page.locator('input[type="file"]').last().setInputFiles(secondHolderPhoto);

  imageEditor = page.getByRole('dialog', { name: /Edit Image/ });
  await imageEditor.getByRole('button', { name: 'Save' }).click();
  await imageEditor.waitFor({ state: 'hidden' });

  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page).toHaveURL(/\/events\/3201\/.*\/tickets\/details/);
  await expect(page.getByRole('heading', { name: 'Your Ticket Dashboard' })).toBeVisible();
  await expect(page.getByText('Payment Successful')).toBeVisible();
  await expect(page.getByText('Single Entry Normal')).toBeVisible();
});