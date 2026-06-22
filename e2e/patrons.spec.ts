import { test, expect } from '@playwright/test'

test.describe('Patron CRUD Operations', () => {
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


  test('should create a new patron', async ({ page }) => {
    // Navigate to patrons page
    await page.click('text=Patrons')
    await page.waitForURL('/admin/patrons')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Get initial count of patrons
    const initialCount = await page.locator('tbody tr').count()

    // Click "Add Patron" button
    await page.click('text=Add Patron')
    await page.waitForURL('/admin/patrons/new')

    // Fill in patron details
    const accountNumber = `TEST-${Date.now()}`
    await page.fill('input[name="accountNumber"]', accountNumber)
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'Patron')
    await page.fill('input[name="serviceStreet"]', '123 Test St')
    await page.fill('input[name="serviceCity"]', 'Bend')
    await page.fill('input[name="serviceState"]', 'OR')
    await page.fill('input[name="serviceZip"]', '97701')
    await page.fill('input[name="primaryEmail"]', 'test@example.com')
    await page.fill('input[name="primaryPhone"]', '555-1234')
    await page.fill('input[name="totalWaterRightAcres"]', '100')
    await page.fill('input[name="assessedAcres"]', '50')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation back to patrons list with network idle
    await page.waitForURL('/admin/patrons', { timeout: 30000 })
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Verify patron was created by checking count increased
    const finalCount = await page.locator('tbody tr').count()
    expect(finalCount).toBe(initialCount + 1)
  })

  test('should read patron details', async ({ page }) => {
    // Navigate to patrons page
    await page.click('text=Patrons')
    await page.waitForURL('/admin/patrons')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click on first patron's name link
    await page.click('tbody tr:first-child td:nth-child(2) a')

    // Verify patron details page loads by checking URL
    await page.waitForURL(/\/admin\/patrons\/.+/)
  })

  test('should update an existing patron', async ({ page }) => {
    // Navigate to patrons page
    await page.click('text=Patrons')
    await page.waitForURL('/admin/patrons')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click on first patron's Edit link
    await page.click('tbody tr:first-child a:has-text("Edit")')
    await page.waitForURL(/\/admin\/patrons\/.+\/edit/)

    // Update patron details
    await page.fill('input[name="firstName"]', 'Updated')
    await page.fill('input[name="lastName"]', 'Name')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation to patron detail page with network idle
    await page.waitForURL(/\/admin\/patrons\/.+/, { timeout: 30000 })
    await page.waitForLoadState('networkidle')
  })


})
