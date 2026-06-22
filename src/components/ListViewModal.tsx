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
