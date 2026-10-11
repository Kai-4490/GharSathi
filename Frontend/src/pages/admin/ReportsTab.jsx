import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as adminApi from '../../api/admin'
import { toastError } from '../../api/client'
import { REPORT_STATUSES, REPORT_STATUS_LABEL } from '../../constants/enums'
import { formatDateTime } from '../../utils/dates'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import Spinner from '../../components/Spinner'
import EmptyState, { ErrorState } from '../../components/EmptyState'

export default function ReportsTab() {
  const [status, setStatus] = useState('')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [reviewing, setReviewing] = useState(null)
  const [deactTarget, setDeactTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setReports(await adminApi.reports(status))
    } catch (e) {
      setError(true)
      toastError(e, 'Could not load reports')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const deactivate = async () => {
    setBusy(true)
    try {
      await adminApi.deactivateUser(deactTarget.id)
      toast.success(`${deactTarget.name} deactivated`)
      setDeactTarget(null)
    } catch (e) {
      toastError(e, 'Could not deactivate user')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label htmlFor="r-status" className="label">Status</label>
        <select id="r-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          {REPORT_STATUSES.map((s) => <option key={s} value={s}>{REPORT_STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message="We could not load reports." onRetry={load} />
      ) : reports.length === 0 ? (
        <EmptyState title="No reports" />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const open = expanded === r.id
            return (
              <li key={r.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-slate-900">
                      #{r.id} · {r.reportedBy?.name} reported{' '}
                      {[r.reportedUser && r.reportedUser.name, r.reportedListing && `listing in ${r.reportedListing.location}`].filter(Boolean).join(' / ')}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                  </div>
                  <StatusBadge kind="report" status={r.status} />
                </div>
                <p className={`mt-2 text-sm text-slate-700 ${open ? '' : 'line-clamp-2'}`}>{r.reason}</p>
                {r.adminNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"><span className="font-medium">Admin note:</span> {r.adminNote}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-ghost" onClick={() => setExpanded(open ? null : r.id)} aria-expanded={open}>{open ? 'Show less' : 'Show full reason'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setReviewing(r)}>Review</button>
                  {r.reportedUser && r.reportedUser.active !== false && (
                    <button type="button" className="btn-secondary text-red-600" onClick={() => setDeactTarget(r.reportedUser)}>Deactivate reported user</button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {reviewing && <ReviewModal report={reviewing} onClose={() => setReviewing(null)} onDone={(updated) => { setReports((rs) => rs.map((x) => (x.id === updated.id ? updated : x))); setReviewing(null) }} />}
      <ConfirmDialog open={!!deactTarget} danger loading={busy} title={`Deactivate ${deactTarget?.name}?`} message="They will no longer be able to log in. This cannot be undone from the app." confirmLabel="Deactivate" onConfirm={deactivate} onCancel={() => !busy && setDeactTarget(null)} />
    </div>
  )
}

function ReviewModal({ report, onClose, onDone }) {
  const [status, setStatus] = useState(report.status === 'ACTION_TAKEN' ? 'ACTION_TAKEN' : 'REVIEWED')
  const [note, setNote] = useState(report.adminNote || '')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const updated = await adminApi.reviewReport(report.id, status, note.trim() || null)
      toast.success('Report updated')
      onDone(updated)
    } catch (err) {
      toastError(err, 'Could not update report')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="review-h" className="card w-full max-w-md p-5">
        <h2 id="review-h" className="text-lg font-semibold text-slate-900">Review report #{report.id}</h2>
        <label htmlFor="rv-status" className="label mt-4">Status</label>
        <select id="rv-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="REVIEWED">{REPORT_STATUS_LABEL.REVIEWED}</option>
          <option value="ACTION_TAKEN">{REPORT_STATUS_LABEL.ACTION_TAKEN}</option>
        </select>
        <label htmlFor="rv-note" className="label mt-4">Admin note (optional)</label>
        <textarea id="rv-note" rows={3} className="input py-2" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save review'}</button>
        </div>
      </form>
    </div>
  )
}
