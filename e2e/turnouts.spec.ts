import { test, expect } from '@playwright/test'

test.describe('Turnout CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')

    // Login with admin credentials
    await page.fill('input[name="email"]', 'admin@arnoldid.com')
    await page.fill('input[name="password"]', 'Arnold-06172026')
    await page.click('button[type="submit"]')

    // Wait for navigation and then go to admin dashboard
    await page.waitForURL('/dashboard')
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should create a new turnout', async ({ page }) => {
    // Navigate to turnouts page
    await page.click('text=Turnouts')
    await page.waitForURL('/admin/turnouts')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Get initial count of turnouts
    const initialCount = await page.locator('tbody tr').count()

    // Click "Add Turnout" button
    await page.click('text=Add Turnout')
    await page.waitForURL('/admin/turnouts/new')

    // Fill in turnout details - select first available patron (skip placeholder)
    await page.selectOption('select[name="accountNumber"]', { index: 1 })
    await page.fill('input[name="canal"]', 'Main Canal')
    await page.fill('input[name="gate"]', 'Gate 1')
    await page.fill('input[name="deliveredAcres"]', '40')
    await page.fill('input[name="acresOwned"]', '50')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation back to turnouts list with network idle
    await page.waitForURL('/admin/turnouts', { timeout: 30000 })
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Verify turnout was created by checking count increased
    const finalCount = await page.locator('tbody tr').count()
    expect(finalCount).toBe(initialCount + 1)
  })

  test('should read turnout details', async ({ page }) => {
    // Navigate to turnouts page
    await page.click('text=Turnouts')
    await page.waitForURL('/admin/turnouts')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click on first turnout's Canal/Gate link
    await page.click('tbody tr:first-child td:nth-child(3) a')

    // Verify turnout details page loads by checking URL
    await page.waitForURL(/\/admin\/turnouts\/.+/)
  })

  test('should update an existing turnout', async ({ page }) => {
    // Navigate to turnouts page
    await page.click('text=Turnouts')
    await page.waitForURL('/admin/turnouts')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click on first turnout's Edit link
    await page.click('tbody tr:first-child a:has-text("Edit")')
    await page.waitForURL(/\/admin\/turnouts\/.+\/edit/)

    // Update turnout details
    await page.fill('input[name="canal"]', 'Updated Canal')
    await page.fill('input[name="deliveredAcres"]', '45')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation to turnout detail page with network idle
    await page.waitForURL(/\/admin\/turnouts\/.+/, { timeout: 30000 })
    await page.waitForLoadState('networkidle')
  })


})
