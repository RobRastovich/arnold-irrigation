export function formatDateInTimezone(date: Date | string, timezone: string = 'America/Los_Angeles'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezone,
    hour12: true,
  }).format(dateObj)
}

export function formatDateTimeInTimezone(date: Date | string, timezone: string = 'America/Los_Angeles'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    hour12: true,
  }).format(dateObj)
}

export function formatTimeInTimezone(date: Date | string, timezone: string = 'America/Los_Angeles'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezone,
    hour12: true,
  }).format(dateObj)
}

export function formatDateOnlyInTimezone(date: Date | string, timezone: string = 'America/Los_Angeles'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).format(dateObj)
}
