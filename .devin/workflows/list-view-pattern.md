---
description: Create list pages with custom list views, column selection, and filtering
---

# List View Pattern

This workflow ensures consistency when creating list pages with custom list views, column selection, and filtering capabilities.

## Database Schema

Add the `SavedListView` model to `prisma/schema.prisma`:

```prisma
model SavedListView {
  id          String   @id @default(cuid())
  name        String
  entityType  String   // "patron", "turnout", etc.
  columns     Json     // Array of column names to display
  filters     Json     // Array of filter criteria { field, operator, value }
  userId      String   // User who created this view
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("saved_list_views")
  @@index([userId])
  @@index([entityType])
}
```

Run `npx prisma db push` to apply schema changes.

## API Endpoints

Create `/src/app/api/admin/list-views/route.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET - Fetch all list views for the current user
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')

    const where: any = { userId: user.userId }
    if (entityType) {
      where.entityType = entityType
    }

    const views = await prisma.savedListView.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(views)
  } catch (error) {
    console.error('Error fetching list views:', error)
    return NextResponse.json({ error: 'Failed to fetch list views' }, { status: 500 })
  }
}

// POST - Create a new list view
export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, entityType, columns, filters, isDefault } = body

    if (!name || !entityType || !columns) {
      return NextResponse.json(
        { error: 'Name, entityType, and columns are required' },
        { status: 400 }
      )
    }

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const view = await prisma.savedListView.create({
      data: {
        name,
        entityType,
        columns,
        filters: filters || [],
        userId: user.userId,
        isDefault: isDefault || false,
      },
    })

    clearCurrentUserId()

    return NextResponse.json(view, { status: 201 })
  } catch (error: any) {
    console.error('Error creating list view:', error)
    clearCurrentUserId()
    return NextResponse.json(
      { error: error.message || 'Failed to create list view' },
      { status: 500 }
    )
  }
}
```

Create `/src/app/api/admin/list-views/[id]/route.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { prisma, setCurrentUserId, clearCurrentUserId } from '@/lib/db'
import { authenticateRequest } from '@/lib/api-auth'

// GET - Fetch a specific list view
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const view = await prisma.savedListView.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
      },
    })

    if (!view) {
      return NextResponse.json({ error: 'List view not found' }, { status: 404 })
    }

    return NextResponse.json(view)
  } catch (error) {
    console.error('Error fetching list view:', error)
    return NextResponse.json({ error: 'Failed to fetch list view' }, { status: 500 })
  }
}

// PUT - Update a list view
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, columns, filters, isDefault } = body

    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    const view = await prisma.savedListView.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(columns && { columns }),
        ...(filters !== undefined && { filters }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    clearCurrentUserId()

    return NextResponse.json(view)
  } catch (error) {
    console.error('Error updating list view:', error)
    clearCurrentUserId()
    return NextResponse.json({ error: 'Failed to update list view' }, { status: 500 })
  }
}

// DELETE - Delete a list view
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
    setCurrentUserId(user.userId, userName)

    await prisma.savedListView.delete({
      where: { id: params.id },
    })

    clearCurrentUserId()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting list view:', error)
    clearCurrentUserId()
    return NextResponse.json({ error: 'Failed to delete list view' }, { status: 500 })
  }
}
```

## ListViewModal Component

Create `/src/components/ListViewModal.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'

interface Column {
  id: string
  label: string
}

interface Filter {
  field: string
  operator: string
  value: string
}

interface ListViewModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: string
  availableColumns: Column[]
  onSave: (view: { name: string; columns: string[]; filters: Filter[] }) => void
  existingView?: {
    id: string
    name: string
    columns: string[]
    filters: Filter[]
  }
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_equal', label: 'Greater or Equal' },
  { value: 'less_equal', label: 'Less or Equal' },
]

export default function ListViewModal({
  isOpen,
  onClose,
  entityType,
  availableColumns,
  onSave,
  existingView,
}: ListViewModalProps) {
  const [name, setName] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [filters, setFilters] = useState<Filter[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existingView) {
      setName(existingView.name)
      setSelectedColumns(existingView.columns)
      setFilters(existingView.filters)
    } else {
      setName('')
      setSelectedColumns(availableColumns.map((col) => col.id))
      setFilters([])
    }
  }, [existingView, availableColumns])

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    )
  }

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }])
  }

  const updateFilter = (index: number, field: keyof Filter, value: string) => {
    const newFilters = [...filters]
    newFilters[index][field] = value
    setFilters(newFilters)
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (!name.trim()) {
      setError('View name is required')
      setSubmitting(false)
      return
    }

    if (selectedColumns.length === 0) {
      setError('At least one column must be selected')
      setSubmitting(false)
      return
    }

    try {
      await onSave({ name, columns: selectedColumns, filters })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save list view')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {existingView ? 'Edit List View' : 'Create New List View'}
          </h3>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Large Water Rights"
                required
                className="sf-input w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Columns to Display *
              </label>
              <div className="border border-gray-300 rounded p-3 max-h-48 overflow-y-auto">
                {availableColumns.map((column) => (
                  <label key={column.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.id)}
                      onChange={() => handleColumnToggle(column.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Filter Criteria
                </label>
                <button
                  type="button"
                  onClick={addFilter}
                  className="text-xs text-blue-600 hover:text-blue-900"
                >
                  + Add Filter
                </button>
              </div>

              {filters.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No filters applied</p>
              ) : (
                <div className="space-y-2">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(index, 'field', e.target.value)}
                        className="sf-input flex-1"
                      >
                        <option value="">Select field...</option>
                        {availableColumns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                        className="sf-input flex-1"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="sf-input flex-1"
                      />

                      <button
                        type="button"
                        onClick={() => removeFilter(index)}
                        className="text-red-600 hover:text-red-900 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sf-btn sf-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sf-btn sf-btn-primary"
              >
                {submitting ? 'Saving...' : existingView ? 'Update View' : 'Create View'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
```

## List Page Integration

### State Management

```tsx
const [listViews, setListViews] = useState<any[]>([])
const [selectedView, setSelectedView] = useState<any>(null)
const [showListViewModal, setShowListViewModal] = useState(false)

const availableColumns = [
  { id: 'field1', label: 'Field 1' },
  { id: 'field2', label: 'Field 2' },
  // ... more columns
]
```

### Fetch List Views

```tsx
const fetchListViews = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/admin/list-views?entityType=yourEntityType', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      setListViews(data)
    }
  } catch (error) {
    console.error('Error fetching list views:', error)
  }
}

useEffect(() => {
  fetchListViews()
}, [])
```

### Filtering Logic

```tsx
const applyFilters = (items: any[], filters: any[]) => {
  return items.filter((item) => {
    return filters.every((filter) => {
      const value = item[filter.field]
      const filterValue = filter.value

      switch (filter.operator) {
        case 'equals':
          return String(value).toLowerCase() === filterValue.toLowerCase()
        case 'not_equals':
          return String(value).toLowerCase() !== filterValue.toLowerCase()
        case 'contains':
          return String(value).toLowerCase().includes(filterValue.toLowerCase())
        case 'not_contains':
          return !String(value).toLowerCase().includes(filterValue.toLowerCase())
        case 'greater_than':
          return Number(value) > Number(filterValue)
        case 'less_than':
          return Number(value) < Number(filterValue)
        case 'greater_equal':
          return Number(value) >= Number(filterValue)
        case 'less_equal':
          return Number(value) <= Number(filterValue)
        default:
          return true
      }
    })
  })
}

const filteredItems = (() => {
  let result = items

  // Apply saved view filters
  if (selectedView && selectedView.filters && selectedView.filters.length > 0) {
    result = applyFilters(result, selectedView.filters)
  }

  // Apply search term
  if (searchTerm) {
    result = result.filter(/* your search logic */)
  }

  return result
})()
```

### Save/Delete Handlers

```tsx
const handleSaveListView = async (view: { name: string; columns: string[]; filters: any[] }) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/admin/list-views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: view.name,
        entityType: 'yourEntityType',
        columns: view.columns,
        filters: view.filters,
      }),
    })

    if (response.ok) {
      await fetchListViews()
    }
  } catch (error) {
    console.error('Error saving list view:', error)
    throw error
  }
}

const handleDeleteView = async (viewId: string) => {
  if (!confirm('Are you sure you want to delete this list view?')) return

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/admin/list-views/${viewId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      if (selectedView?.id === viewId) {
        setSelectedView(null)
      }
      await fetchListViews()
    }
  } catch (error) {
    console.error('Error deleting list view:', error)
  }
}
```

### Dynamic Column Rendering

```tsx
const getVisibleColumns = () => {
  if (selectedView && selectedView.columns) {
    return selectedView.columns
  }
  return availableColumns.map((col) => col.id)
}

const renderColumnValue = (item: any, columnId: string) => {
  switch (columnId) {
    case 'field1':
      return item.field1
    case 'field2':
      return item.field2
    // ... handle each column
    default:
      return '-'
  }
}
```

### UI Components

Add list view selector and create button in header:

```tsx
<header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
  <h2 className="text-xl font-semibold text-gray-900">Items</h2>
  <div className="flex gap-2">
    <button
      onClick={() => setShowListViewModal(true)}
      className="sf-btn sf-btn-secondary"
    >
      Create List View
    </button>
    <Link href="/admin/items/new" className="sf-btn sf-btn-primary">
      + Add Item
    </Link>
  </div>
</header>
```

Add list view selector dropdown in content area:

```tsx
<div className="p-4 border-b border-gray-200 flex gap-4 items-center">
  <div className="flex-1">
    <select
      value={selectedView?.id || ''}
      onChange={(e) => {
        const view = listViews.find((v) => v.id === e.target.value)
        setSelectedView(view || null)
      }}
      className="sf-input w-full"
    >
      <option value="">All Items (Default View)</option>
      {listViews.map((view) => (
        <option key={view.id} value={view.id}>
          {view.name}
        </option>
      ))}
    </select>
  </div>
  {selectedView && (
    <button
      onClick={() => handleDeleteView(selectedView.id)}
      className="text-red-600 hover:text-red-900 text-sm"
    >
      Delete View
    </button>
  )}
  <div className="flex-1">
    <input
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="sf-input w-full"
    />
  </div>
</div>
```

Render dynamic table:

```tsx
<table className="w-full">
  <thead className="bg-gray-50">
    <tr>
      {getVisibleColumns().map((columnId: string) => {
        const column = availableColumns.find((c) => c.id === columnId)
        return (
          <th
            key={columnId}
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {column?.label}
          </th>
        )
      })}
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Actions
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {filteredItems.map((item) => (
      <tr key={item.id} className="hover:bg-gray-50">
        {getVisibleColumns().map((columnId: string) => (
          <td
            key={columnId}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            {renderColumnValue(item, columnId)}
          </td>
        ))}
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <Link href={`/admin/items/${item.id}/edit`} className="text-primary-600 hover:text-primary-900">
            Edit
          </Link>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Render Modal

```tsx
<ListViewModal
  isOpen={showListViewModal}
  onClose={() => setShowListViewModal(false)}
  entityType="yourEntityType"
  availableColumns={availableColumns}
  onSave={handleSaveListView}
/>
```

## Important Notes

- Always run `npx prisma db push` after adding the SavedListView model to apply schema changes
- The `entityType` should match the entity name (e.g., "patron", "turnout")
- Filters are applied in combination with search terms
- Views are saved per user (based on userId)
- Always include audit logging using `setCurrentUserId` and `clearCurrentUserId`
