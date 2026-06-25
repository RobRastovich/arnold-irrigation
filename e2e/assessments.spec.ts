import { test, expect } from '@playwright/test'

test.describe('Assessments Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@arnoldid.com')
    await page.fill('input[name="password"]', 'Arnold-06172026')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should display assessments list page', async ({ page }) => {
    await page.click('text=Assessments')
    await page.waitForURL('/admin/invoices')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1').filter({ hasText: 'Assessments' })).toBeVisible()
    await expect(page.locator('input[placeholder*="Search assessment"]')).toBeVisible()
    await expect(page.locator('select').filter({ hasText: 'All Statuses' })).toBeVisible()
  })

  test('should filter assessments by status', async ({ page }) => {
    await page.click('text=Assessments')
    await page.waitForURL('/admin/invoices')
    await page.waitForLoadState('networkidle')

    await page.selectOption('select', 'PAID')
    await page.waitForLoadState('networkidle')

    // Either rows matching PAID exist, or empty state shows
    const emptyState = page.locator('text=No assessments match your filters.')
    const firstRow = page.locator('tbody tr').first()
    await expect(emptyState.or(firstRow)).toBeVisible()
  })

  test('should filter assessments by search term', async ({ page }) => {
    await page.click('text=Assessments')
    await page.waitForURL('/admin/invoices')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder*="Search assessment"]', 'zzz_no_match')
    await expect(
      page.locator('text=No assessments match your filters.').or(page.locator('text=No assessments yet.'))
    ).toBeVisible()
  })

  test('should navigate to assessment detail', async ({ page }) => {
    await page.click('text=Assessments')
    await page.waitForURL('/admin/invoices')
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('tbody tr a').first()
    const count = await firstLink.count()

    if (count === 0) {
      test.skip()
      return
    }

    await firstLink.click()
    await page.waitForURL(/\/admin\/invoices\/.+/)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=ASSESSMENT')).toBeVisible()
    await expect(page.locator('text=Assessment Settings')).toBeVisible()
  })

  test('should update assessment status', async ({ page }) => {
    await page.click('text=Assessments')
    await page.waitForURL('/admin/invoices')
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('tbody tr a').first()
    const count = await firstLink.count()

    if (count === 0) {
      test.skip()
      return
    }

    await firstLink.click()
    await page.waitForURL(/\/admin\/invoices\/.+/)
    await page.waitForLoadState('networkidle')

    await page.selectOption('select', 'SENT')
    await page.click('text=Save Changes')

    await page.waitForLoadState('networkidle')
    await expect(page.locator('span').filter({ hasText: 'SENT' }).first()).toBeVisible()
  })

  test('should navigate back to assessments from detail', async ({ page }) => {
    await page.click('text=Assessments')
    await page.waitForURL('/admin/invoices')
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('tbody tr a').first()
    const count = await firstLink.count()

    if (count === 0) {
      test.skip()
      return
    }

    await firstLink.click()
    await page.waitForURL(/\/admin\/invoices\/.+/)
    await page.waitForLoadState('networkidle')

    await page.click('text=← Assessments')
    await page.waitForURL('/admin/invoices')
    await expect(page.locator('h1').filter({ hasText: 'Assessments' })).toBeVisible()
  })
})
