import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as reportsApi from '../api/reports'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'

// At least one of reportedUserId / reportedListingId must be provided by the caller.
export default function ReportModal({ open, onClose, reportedUserId = null, reportedListingId = null, targetLabel }) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const hasTarget = reportedUserId != null || reportedListingId != null

  useEffect(() => {
    if (open) {
      setReason('')
      setError('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    const text = reason.trim()
    if (!hasTarget) return setError('Nothing to report.')
    if (text.length < 10) return setError('Please describe the problem in at least 10 characters.')
    setBusy(true)
    try {
      await reportsApi.fileReport({
        reportedByUserId: user.id,
        reportedUserId: reportedUserId ?? null,
        reportedListingId: reportedListingId ?? null,
        reason: text,
      })
      toast.success('Report submitted. Thank you.')
      onClose()
    } catch (err) {
      toastError(err, 'Could not submit report')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="report-title" className="card w-full max-w-md p-5" noValidate>
        <h2 id="report-title" className="text-lg font-semibold text-slate-900">Report {targetLabel || 'this'}</h2>
        <p className="mt-1 text-sm text-slate-500">Tell us what is wrong. Our admins will review it.</p>
        <label htmlFor="report-reason" className="label mt-4">Reason</label>
        <textarea id="report-reason" rows={4} className="input py-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe what happened…" autoFocus />
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy || !hasTarget}>{busy ? 'Submitting…' : 'Submit report'}</button>
        </div>
      </form>
    </div>
  )
}
