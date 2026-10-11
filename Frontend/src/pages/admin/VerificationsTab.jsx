import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as adminApi from '../../api/admin'
import { toastError } from '../../api/client'
import { formatDateTime } from '../../utils/dates'
import Spinner from '../../components/Spinner'
import EmptyState, { ErrorState } from '../../components/EmptyState'

export default function VerificationsTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setRows(await adminApi.pendingVerifications())
    } catch (e) {
      setError(true)
      toastError(e, 'Could not load verification queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // profileId is Profile.id, not the user id.
  const act = async (p, status) => {
    setBusyId(p.id)
    try {
      await adminApi.setVerification(p.id, status)
      setRows((rs) => rs.filter((r) => r.id !== p.id))
      toast.success(status === 'VERIFIED' ? 'Approved' : 'Rejected')
    } catch (e) {
      toastError(e, 'Could not update verification')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorState message="We could not load the verification queue." onRetry={load} />
  if (rows.length === 0) return <EmptyState title="Nothing waiting for review" />

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{['Profile', 'Name', 'Mobile', 'Occupation', 'Document', 'Updated', ''].map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-2 tabular-nums">{p.id}</td>
              <td className="px-3 py-2 font-medium text-slate-900">{p.user?.name}</td>
              <td className="px-3 py-2">{p.user?.mobileNumber}</td>
              <td className="px-3 py-2">{p.occupation || '—'}</td>
              <td className="px-3 py-2">
                {p.verificationDocUrl ? <a href={p.verificationDocUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">Open document</a> : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2">{formatDateTime(p.updatedAt)}</td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <button type="button" className="btn-primary" disabled={busyId === p.id} onClick={() => act(p, 'VERIFIED')}>Approve</button>
                  <button type="button" className="btn-secondary text-red-600" disabled={busyId === p.id} onClick={() => act(p, 'REJECTED')}>Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
