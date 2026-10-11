// Circular compatibility score. Colour bands match the old bar: 70+ green, 40+ amber, below grey.
export default function ScoreRing({ score, size = 96, showLabel = true }) {
  if (score == null) return null
  const n = Math.max(0, Math.min(100, Math.round(score)))
  const tone = n >= 70 ? { arc: '#1f9d6b', text: 'text-emerald-700' } : n >= 40 ? { arc: '#e08e0b', text: 'text-amber-700' } : { arc: '#64748b', text: 'text-slate-600' }
  const stroke = size >= 80 ? 10 : 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1" title={`Compatibility ${n} out of 100`}>
      <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Compatibility ${n} out of 100`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d3e3dc" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone.arc} strokeWidth={stroke} strokeLinecap="butt" strokeDasharray={`${(c * n) / 100} ${c}`} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-display font-bold tabular-nums ${tone.text} ${size >= 80 ? 'text-[1.75rem]' : 'text-base'}`}>{n}</span>
      </div>
      {showLabel && <span className="text-xs font-medium text-slate-600">Compatibility</span>}
    </div>
  )
}
