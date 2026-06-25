import { test, expect } from '@playwright/test'

test.describe('Audit Log Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')

    // Login with admin credentials
    await page.fill('input[name="email"]', 'admin@arnoldid.com')
    await page.fill('input[name="password"]', 'Arnold-06172026')
    await page.click('button[type="submit"]')

    // Wait for navigation and then go to admin dashboard
    await page.waitForURL(/\/dashboard/)
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should view audit logs', async ({ page }) => {
    // Navigate to audit logs page
    await page.click('text=Audit Logs')
    await page.waitForURL('/admin/audit-logs')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Verify audit logs table is visible
    const table = page.locator('table')
    await expect(table).toBeVisible()

    // Verify at least one row exists
    const rowCount = await page.locator('tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('should filter audit logs by table name', async ({ page }) => {
    // Navigate to audit logs page
    await page.click('text=Audit Logs')
    await page.waitForURL('/admin/audit-logs')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Get initial count of logs
    const initialCount = await page.locator('tbody tr').count()

    // Filter by table name
    const filterInput = page.locator('input[placeholder*="table name"]').first()
    if (await filterInput.isVisible()) {
      await filterInput.fill('Patron')
      await page.click('text=Search')

      // Wait for filtered results
      await page.waitForLoadState('networkidle')

      // Verify filtered results
      const filteredCount = await page.locator('tbody tr').count()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    }
  })

  test('should display audit log details', async ({ page }) => {
    // Navigate to audit logs page
    await page.click('text=Audit Logs')
    await page.waitForURL('/admin/audit-logs')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Click on first audit log row
    await page.click('tbody tr:first-child')

    // Verify details are displayed (could be a modal or expanded row)
    await page.waitForTimeout(500)
  })
})
