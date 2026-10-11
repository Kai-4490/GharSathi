import { useState } from 'react'

// Controlled chip entry. `value` is an array of strings.
export default function ChipInput({ id, label, value, onChange, suggestions = [], placeholder = 'Type and press Enter', helper }) {
  const [draft, setDraft] = useState('')

  const add = (raw) => {
    const t = raw.trim().replace(/,+$/, '').trim()
    if (!t) return
    if (value.some((v) => v.toLowerCase() === t.toLowerCase())) return setDraft('')
    onChange([...value, t])
    setDraft('')
  }
  const remove = (v) => onChange(value.filter((x) => x !== v))

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))

  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-300 bg-white p-2 focus-within:ring-2 focus-within:ring-brand-500">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => remove(v)} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-brand-100">
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length ? '' : placeholder}
          className="min-h-[32px] min-w-[8rem] flex-1 border-0 bg-transparent p-1 text-sm outline-none focus:ring-0"
        />
      </div>
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggestions">
          {remaining.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:border-brand-400 hover:text-brand-700">
              + {s}
            </button>
          ))}
        </div>
      )}
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  )
}
