import { test, expect } from '@playwright/test'

test.describe('Rate Schedule Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@arnoldid.com')
    await page.fill('input[name="password"]', 'Arnold-06172026')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should create a new rate schedule', async ({ page }) => {
    await page.click('text=Rates')
    await page.waitForURL('/admin/rates')
    await page.waitForLoadState('networkidle')

    await page.click('text=+ New Rate Schedule')

    await expect(page.locator('text=New Rate Schedule').nth(1)).toBeVisible()

    const yearInput = page.locator('input[type="number"][min="1900"]')
    await yearInput.fill('2099')

    await page.click('button[type="submit"]:has-text("Create")')

    await page.waitForURL(/\/admin\/rates\/.+/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=2099')).toBeVisible()
  })

  test('should display rates list', async ({ page }) => {
    await page.click('text=Rates')
    await page.waitForURL('/admin/rates')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1').filter({ hasText: 'Rates' })).toBeVisible()
    await expect(page.locator('text=+ New Rate Schedule')).toBeVisible()
  })

  test('should navigate to rate detail', async ({ page }) => {
    await page.click('text=Rates')
    await page.waitForURL('/admin/rates')
    await page.waitForLoadState('networkidle')

    const firstRateLink = page.locator('tbody tr a').first()
    await firstRateLink.click()

    await page.waitForURL(/\/admin\/rates\/.+/)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/admin\/rates\/.+/)
    await expect(page.locator('text=⚡ Generate Assessment')).toBeVisible()
  })

  test('should filter rates by year', async ({ page }) => {
    await page.click('text=Rates')
    await page.waitForURL('/admin/rates')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder="Filter by year…"]', '9999')
    await expect(page.locator('text=No rate schedules match.')).toBeVisible()
  })

  test('should delete a rate schedule', async ({ page }) => {
    // First create one to safely delete
    await page.goto('/admin/rates')
    await page.waitForLoadState('networkidle')
    await page.click('text=+ New Rate Schedule')

    const yearInput = page.locator('input[type="number"][min="1900"]')
    await yearInput.fill('1901')
    await page.click('button[type="submit"]:has-text("Create")')
    await page.waitForURL(/\/admin\/rates\/.+/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    page.once('dialog', (dialog) => dialog.accept())
    await page.click('text=Delete Schedule')

    await page.waitForURL('/admin/rates', { timeout: 15000 })
    await expect(page).toHaveURL('/admin/rates')
  })
})
