import { test, expect } from '@playwright/test'

test.describe('Storage Report CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@arnoldid.com')
    await page.fill('input[name="password"]', 'Arnold-06172026')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should create a new storage report', async ({ page }) => {
    await page.click('text=Storage Report')
    await page.waitForURL('/admin/storage-reports')
    await page.waitForLoadState('networkidle')

    await page.click('text=+ New Storage Report')
    await page.waitForURL('/admin/storage-reports/new')

    await page.fill('input[name="startDate"]', '2026-08-15')
    await page.fill('input[name="endDate"]', '2026-08-31')

    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin\/storage-reports\/.+/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h2').filter({ hasText: /WY 2026/ })).toBeVisible()
  })

  test('should display storage reports list', async ({ page }) => {
    await page.click('text=Storage Report')
    await page.waitForURL('/admin/storage-reports')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h2').filter({ hasText: 'Storage Reports' })).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should navigate to storage report detail', async ({ page }) => {
    await page.click('text=Storage Report')
    await page.waitForURL('/admin/storage-reports')
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('tbody a').first()
    if (await firstLink.count()) {
      await firstLink.click()
      await page.waitForURL(/\/admin\/storage-reports\/.+/)
      await expect(page).toHaveURL(/\/admin\/storage-reports\/.+/)
    }
  })

  test('should filter storage reports by search', async ({ page }) => {
    await page.click('text=Storage Report')
    await page.waitForURL('/admin/storage-reports')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder="Search by water year, period, or status..."]', 'zzz_no_match')
    await expect(page.locator('text=No storage reports found')).toBeVisible()
  })
})
