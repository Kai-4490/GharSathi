const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatINR = (n) => (n == null || Number.isNaN(Number(n)) ? '' : inr.format(Number(n)))

export function formatRentRange(min, max) {
  if (min != null && max != null) return min === max ? formatINR(min) : `${formatINR(min)} – ${formatINR(max)}`
  if (min != null) return `from ${formatINR(min)}`
  if (max != null) return `up to ${formatINR(max)}`
  return 'Rent not specified'
}
