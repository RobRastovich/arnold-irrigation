import { test, expect } from '@playwright/test'

test.describe('Weir Book CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@arnoldid.com')
    await page.fill('input[name="password"]', 'Arnold-06172026')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard/)
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should create a new weir book', async ({ page }) => {
    await page.click('text=Weir Books')
    await page.waitForURL('/admin/weir-books')
    await page.waitForLoadState('networkidle')

    await page.click('text=+ New Weir Book')
    await page.waitForURL('/admin/weir-books/new')

    await page.fill('input[name="canal"]', 'Test Canal')
    await page.fill('input[name="weirLocation"]', '42')

    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin\/weir-books\/.+/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h2, h1').filter({ hasText: /weir book/i }).or(page.locator('text=Test Canal'))).toBeVisible()
  })

  test('should display weir books list', async ({ page }) => {
    await page.click('text=Weir Books')
    await page.waitForURL('/admin/weir-books')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h2').filter({ hasText: 'Weir Books' })).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should navigate to weir book detail', async ({ page }) => {
    await page.click('text=Weir Books')
    await page.waitForURL('/admin/weir-books')
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('tbody tr.bg-blue-50 a').first()
    await firstLink.click()

    await page.waitForURL(/\/admin\/weir-books\/.+/)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/admin\/weir-books\/.+/)
  })

  test('should filter weir books by search', async ({ page }) => {
    await page.click('text=Weir Books')
    await page.waitForURL('/admin/weir-books')
    await page.waitForLoadState('networkidle')

    await page.fill('input[placeholder="Search by canal or location..."]', 'zzz_no_match')
    await expect(page.locator('text=No weir books found')).toBeVisible()
  })
})
