import { test, expect } from '@playwright/test'

test.describe('User CRUD Operations', () => {
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

  test('should create a new user', async ({ page }) => {
    // Navigate to users page
    await page.click('text=Users')
    await page.waitForURL('/admin/users')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Get initial count of users
    const initialCount = await page.locator('tbody tr').count()

    // Click "Add User" button
    await page.click('text=Add User')
    await page.waitForURL('/admin/users/new')

    // Fill in user details
    const email = `test${Date.now()}@example.com`
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'User')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.selectOption('select[name="role"]', 'PATRON')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation back to users list with network idle
    await page.waitForURL('/admin/users', { timeout: 30000 })
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Verify user was created by checking count increased
    const finalCount = await page.locator('tbody tr').count()
    expect(finalCount).toBe(initialCount + 1)
  })

  test('should read user details', async ({ page }) => {
    // Navigate to users page
    await page.click('text=Users')
    await page.waitForURL('/admin/users')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click on first user's name link
    await page.click('tbody tr:first-child td:first-child a')

    // Verify user details page loads by checking URL
    await page.waitForURL(/\/admin\/users\/.+/)
  })

  test('should update an existing user', async ({ page }) => {
    // Navigate to users page
    await page.click('text=Users')
    await page.waitForURL('/admin/users')

    // Wait for data to load with network idle
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    // Click on first user's Edit link
    await page.click('tbody tr:first-child a:has-text("Edit")')
    await page.waitForURL(/\/admin\/users\/.+\/edit/)

    // Update user details
    await page.fill('input[name="firstName"]', 'Updated')
    await page.fill('input[name="lastName"]', 'Name')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for navigation to user detail page with network idle
    await page.waitForURL(/\/admin\/users\/.+/, { timeout: 30000 })
    await page.waitForLoadState('networkidle')
  })
})
