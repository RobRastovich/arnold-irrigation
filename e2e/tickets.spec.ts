import { test, expect } from '@playwright/test'

test.describe('Ticket CRUD Operations', () => {
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

  test('should create a new ticket', async ({ page }) => {
    // Navigate to tickets page
    await page.click('text=Tickets')
    await page.waitForURL('/admin/tickets')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Get initial count of tickets
    const initialCount = await page.locator('tbody tr').count()

    // Click "New Ticket" button
    await page.click('text=New Ticket')
    await page.waitForURL('/admin/tickets/new')

    // Fill in ticket details
    const title = `Test Ticket ${Date.now()}`
    await page.fill('input[name="title"]', title)
    await page.selectOption('select[name="type"]', 'BUG_FIX')
    await page.selectOption('select[name="priority"]', 'MEDIUM')
    await page.fill('textarea[name="description"]', 'This is a test ticket description')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation back to tickets list with network idle
    await page.waitForURL('/admin/tickets', { timeout: 30000 })
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Verify ticket was created by checking count increased
    const finalCount = await page.locator('tbody tr').count()
    expect(finalCount).toBe(initialCount + 1)
  })

  test('should read ticket details', async ({ page }) => {
    // Navigate to tickets page
    await page.click('text=Tickets')
    await page.waitForURL('/admin/tickets')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click on first ticket's title link
    await page.click('tbody tr:first-child td:nth-child(2) a')

    // Verify ticket details page loads by checking URL
    await page.waitForURL(/\/admin\/tickets\/.+/)
  })

  test('should update an existing ticket', async ({ page }) => {
    // Navigate to tickets page
    await page.click('text=Tickets')
    await page.waitForURL('/admin/tickets')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click on first ticket's Edit link
    await page.click('tbody tr:first-child a:has-text("Edit")')
    await page.waitForURL(/\/admin\/tickets\/.+\/edit/)

    // Update ticket details
    await page.fill('input[name="title"]', 'Updated Ticket Title')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation to ticket detail page with network idle
    await page.waitForURL(/\/admin\/tickets\/.+/, { timeout: 30000 })
    await page.waitForLoadState('networkidle')
  })
})
