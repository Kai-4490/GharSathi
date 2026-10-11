// Every optional field: "" / whitespace -> null before sending to the backend.
export function emptyToNull(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' && v.trim() === '' ? null : v
  }
  return out
}

// Strip spaces, dashes, brackets and a leading +91 / 91 / 0 so the same 10-digit form is always sent.
export function normalizeMobile(input) {
  let s = String(input || '').replace(/[\s\-().]/g, '')
  if (s.startsWith('+91')) s = s.slice(3)
  else if (s.length === 12 && s.startsWith('91')) s = s.slice(2)
  else if (s.length === 11 && s.startsWith('0')) s = s.slice(1)
  return s
}

export const isValidMobile = (s) => /^\d{10}$/.test(s)
export const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// number input value -> Number or null
export const numOrNull = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v))
