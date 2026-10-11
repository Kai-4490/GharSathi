import { initials, toneFor } from '../utils/ui'

const SIZES = { sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-14 w-14 text-base' }

export default function Avatar({ user, size = 'md', className = '' }) {
  const tone = toneFor(user?.id)
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold ${tone.bg} ${tone.text} ${SIZES[size]} ${className}`} aria-hidden="true">
      {initials(user?.name)}
    </span>
  )
}
