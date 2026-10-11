// Rotating card / avatar colours from the mockups. Picked from the id so a given
// listing or person always keeps the same colour.
const TONES = [
  { bg: 'bg-sun-400', text: 'text-brand-900' },
  { bg: 'bg-coral-400', text: 'text-brand-900' },
  { bg: 'bg-mint-400', text: 'text-brand-900' },
]

export const toneFor = (id) => TONES[Math.abs(Number(id) || 0) % TONES.length]

// "Aarav K." -> "AK", "Rohan" -> "RO"
export function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
