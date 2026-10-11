import { format, formatDistanceToNow, isSameDay } from 'date-fns'

// Accepts an ISO string ("2026-10-11T14:32:10.123456"), an array
// [y, m, d, h, mi, s, nanos] (WebSocket payloads), or a Date. Returns a Date or null.
export function parseDate(v) {
  if (v == null || v === '') return null
  if (v instanceof Date) return v
  if (Array.isArray(v)) {
    const [y, m, d, h = 0, mi = 0, s = 0, nanos = 0] = v
    return new Date(y, m - 1, d, h, mi, s, Math.floor(nanos / 1e6))
  }
  if (typeof v === 'string') {
    // Trim precision beyond milliseconds so Date can parse it everywhere.
    const trimmed = v.replace(/(\.\d{3})\d+/, '$1')
    // "YYYY-MM-DD" must be treated as a local date, not UTC.
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export const formatDate = (v) => {
  const d = parseDate(v)
  return d ? format(d, 'd MMM yyyy') : ''
}
export const formatDateTime = (v) => {
  const d = parseDate(v)
  return d ? format(d, 'd MMM yyyy, h:mm a') : ''
}
export const formatTime = (v) => {
  const d = parseDate(v)
  return d ? format(d, 'h:mm a') : ''
}
export const formatRelative = (v) => {
  const d = parseDate(v)
  return d ? formatDistanceToNow(d, { addSuffix: true }) : ''
}
export const formatDayLabel = (v) => {
  const d = parseDate(v)
  if (!d) return ''
  if (isSameDay(d, new Date())) return 'Today'
  return format(d, 'EEE, d MMM yyyy')
}
export const sameDay = (a, b) => {
  const da = parseDate(a)
  const db = parseDate(b)
  return !!da && !!db && isSameDay(da, db)
}
// LocalDate strings are already "YYYY-MM-DD", which is what <input type="date"> wants.
export const toDateInput = (v) => (typeof v === 'string' ? v.slice(0, 10) : '')
