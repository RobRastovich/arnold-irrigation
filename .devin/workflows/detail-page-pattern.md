---
description: Create detail pages with related lists following the Salesforce-like pattern
---

# Detail Page and Related List Pattern

This workflow ensures consistency when creating new detail pages and related lists in the Arnold Irrigation application.

## Detail Page Structure

### Layout
- Use the `sf-card` class for compact card sections
- Use a 3-column grid (`grid-cols-1 md:grid-cols-3`) for Basic Information cards
- Group related fields together (e.g., Service & Mailing Address in one card)
- Use `sf-field-label` for field labels and `sf-field-value` for field values

### Header
- Include page title with Edit button in the top right
- Use Link component for navigation

### Field Validation Highlighting
- Add per-field validation highlighting using `sf-field-highlighted` class
- Apply highlighting to individual field containers, not the entire card
- Use conditional className with IIFE to calculate validation logic
- Example:
```tsx
<div className={(() => {
  const mismatch = Math.abs(expected - actual) > 0.01
  return mismatch ? 'sf-field-highlighted' : ''
})()}>
  <p className="sf-field-label">Field Name</p>
  <p className="sf-field-value">{value}</p>
</div>
```

## Related List Pattern

### Table Format
All related lists should use a table format with the `sf-table` class:
```tsx
<table className="sf-table">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
      <th>Column 3</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item) => (
      <tr key={item.id}>
        <td>{item.field1}</td>
        <td>{item.field2}</td>
        <td>{item.field3}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Clickable Names
- If the related object has a detail page, make the name a clickable Link
- Use blue color (`text-blue-600 hover:text-blue-900`) for links
- Example:
```tsx
<td>
  <Link href={`/admin/object/${item.id}`} className="text-blue-600 hover:text-blue-900">
    {item.name}
  </Link>
</td>
```

### Text Truncation
- For long text fields (like notes), truncate to first 100 characters
- Add "..." if text is longer than limit
- Example:
```tsx
<td>
  {item.text.length > 100
    ? `${item.text.substring(0, 100)}...`
    : item.text}
</td>
```

## Window Shade Component

### Usage
- Wrap related lists in `WindowShade` component
- Set `defaultOpen={false}` to keep lists collapsed by default
- Include count in title: `title={`Items (${items.length})`}`
- Add action button for creating new items:
```tsx
<WindowShade
  title={`Items (${items.length})`}
  defaultOpen={false}
  actionButton={
    <button
      className="sf-btn sf-btn-secondary text-xs"
      onClick={() => setShowModal(true)}
    >
      New Item
    </button>
  }
>
  {/* Table content */}
</WindowShade>
```

## Modal Pattern for Adding Items

### Create Modal Component
- Create modal component in `/src/components/[Item]Modal.tsx`
- Modal should accept props: `isOpen`, `onClose`, `parentId`, `onItemAdded`
- Use Salesforce-style button classes: `sf-btn sf-btn-primary` and `sf-btn sf-btn-secondary`
- After successful creation, call `onItemAdded()` and `onClose()`

### Modal Structure
```tsx
'use client'

import { useState } from 'react'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  parentId: string
  onItemAdded: () => void
}

export default function AddItemModal({ isOpen, onClose, parentId, onItemAdded }: AddItemModalProps) {
  const [formData, setFormData] = useState({...})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/parents/${parentId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create item')
      }

      onItemAdded()
      onClose()
      setFormData({...}) // Reset form
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Item</h3>
          {/* Form content */}
        </div>
      </div>
    </div>
  )
}
```

### Integrate Modal in Detail Page
- Add modal state: `const [showModal, setShowModal] = useState(false)`
- Add handler: `const handleItemAdded = () => { fetchItems() }`
- Import and render modal at bottom of page:
```tsx
<AddItemModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  parentId={params.id as string}
  onItemAdded={handleItemAdded}
/>
```

## CSS Classes Reference

### Cards
- `sf-card` - Base card styling
- `sf-card-header` - Card header styling
- `sf-field-highlighted` - Yellow background for validation errors

### Form Elements
- `sf-input` - Input field styling
- `sf-btn` - Base button styling
- `sf-btn-primary` - Primary action button
- `sf-btn-secondary` - Secondary action button

### Tables
- `sf-table` - Table styling for related lists

### Fields
- `sf-field-label` - Field label styling
- `sf-field-value` - Field value styling

## Pre-populating Related Object Creation

When creating a related object from a detail page:
1. Add parent ID or reference as URL query parameter in the "New Item" button
2. In the new item page, read the parameter using `useSearchParams()`
3. Pre-populate the form field with the parameter value
4. Example:
```tsx
// In detail page action button
<Link href={`/admin/items/new?parentId=${patron.id}`} className="sf-btn sf-btn-secondary text-xs">
  New Item
</Link>

// In new item page
const searchParams = useSearchParams()
const parentId = searchParams.get('parentId')

useEffect(() => {
  if (parentId) {
    setFormData({...formData, parentId})
  }
}, [parentId])
```

## Foreign Key Links

On related object detail pages:
- Make the foreign key (e.g., patron) a clickable link back to the parent detail page
- Ensure the API returns the parent object's ID
- Example:
```tsx
{item.patron?.id ? (
  <Link href={`/admin/patrons/${item.patron.id}`} className="text-blue-600 hover:text-blue-900">
    {item.patron.firstName} {item.patron.lastName}
  </Link>
) : (
  <p className="font-medium text-gray-900">
    {item.patron?.firstName} {item.patron?.lastName}
  </p>
)}
```

## API Considerations

### Include Parent Information
- When fetching related objects, include parent object data with ID
- Use Prisma `include` to fetch related data
- Example:
```tsx
const items = await prisma.item.findMany({
  include: {
    patron: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  },
})
```

### Audit Logging
- Use `setCurrentUserId()` and `clearCurrentUserId()` for audit trails
- Example:
```tsx
const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email
setCurrentUserId(user.userId, userName)
// ... perform database operation
clearCurrentUserId()
```
