import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as reportsApi from '../api/reports'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/dates'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import EmptyState, { ErrorState } from '../components/EmptyState'

export default function Blocked() {
  const { user, removeBlocked } = useAuth()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setBlocks(await reportsApi.blockedBy(user.id))
    } catch (e) {
      setError(true)
      toastError(e, 'Could not load blocked users')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  const unblock = async () => {
    setBusy(true)
    try {
      await reportsApi.unblock(user.id, target.id)
      removeBlocked(target.id)
      setBlocks((bs) => bs.filter((b) => b.blocked?.id !== target.id))
      toast.success(`${target.name} unblocked`)
      setTarget(null)
    } catch (e) {
      toastError(e, 'Could not unblock user')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Blocked users</h1>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message="We could not load your blocked users." onRetry={load} />
      ) : blocks.length === 0 ? (
        <EmptyState title="You haven't blocked anyone" message="People you block will appear here." />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{b.blocked?.name}</p>
                <p className="text-xs text-slate-500">Blocked on {formatDate(b.createdAt)}</p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setTarget(b.blocked)}>Unblock</button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!target} loading={busy} title={`Unblock ${target?.name}?`} message="Their listings and conversations will appear for you again." confirmLabel="Unblock" onConfirm={unblock} onCancel={() => !busy && setTarget(null)} />
    </div>
  )
}
