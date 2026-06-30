export interface SortConfig {
  column: string | null
  direction: 'asc' | 'desc'
}

export function sortItems<T>(
  items: T[],
  sortConfig: SortConfig,
  getValue?: (item: T, column: string) => any
): T[] {
  if (!sortConfig.column) return items

  return [...items].sort((a, b) => {
    let aValue: any = getValue ? getValue(a, sortConfig.column!) : (a as any)[sortConfig.column!]
    let bValue: any = getValue ? getValue(b, sortConfig.column!) : (b as any)[sortConfig.column!]

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortConfig.direction === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
    }

    const aStr = String(aValue ?? '').toLowerCase()
    const bStr = String(bValue ?? '').toLowerCase()
    if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
    if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })
}

export function nextSortConfig(
  current: SortConfig,
  columnId: string
): SortConfig {
  if (current.column === columnId && current.direction === 'desc') {
    return { column: null, direction: 'asc' }
  }
  return {
    column: columnId,
    direction: current.column === columnId && current.direction === 'asc' ? 'desc' : 'asc',
  }
}
