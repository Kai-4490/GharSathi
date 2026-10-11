import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as adminApi from '../../api/admin'
import { toastError } from '../../api/client'
import { ROLE_LABEL } from '../../constants/enums'
import { formatDate } from '../../utils/dates'
import ConfirmDialog from '../../components/ConfirmDialog'
import Spinner from '../../components/Spinner'
import EmptyState, { ErrorState } from '../../components/EmptyState'

export default function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [q, setQ] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setUsers(await adminApi.users())
    } catch (e) {
      setError(true)
      toastError(e, 'Could not load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const deactivate = async () => {
    setBusy(true)
    try {
      const updated = await adminApi.deactivateUser(target.id)
      setUsers((us) => us.map((u) => (u.id === updated.id ? updated : u)))
      toast.success(`${target.name} deactivated`)
      setTarget(null)
    } catch (e) {
      toastError(e, 'Could not deactivate user')
    } finally {
      setBusy(false)
    }
  }

  const needle = q.trim().toLowerCase()
  const shown = users.filter((u) => !needle || u.name?.toLowerCase().includes(needle) || u.mobileNumber?.includes(needle))

  if (loading) return <Spinner />
  if (error) return <ErrorState message="We could not load users." onRetry={load} />

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <label htmlFor="user-search" className="label">Search by name or mobile</label>
        <input id="user-search" className="input" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {shown.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['ID', 'Name', 'Mobile', 'Email', 'Role', 'OTP', 'Status', 'Joined', ''].map((h) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 tabular-nums">{u.id}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{u.name}</td>
                  <td className="px-3 py-2">{u.mobileNumber}</td>
                  <td className="px-3 py-2">{u.email || '—'}</td>
                  <td className="px-3 py-2">{ROLE_LABEL[u.role] || u.role}</td>
                  <td className="px-3 py-2">{u.otpVerified ? 'Verified' : 'Unverified'}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{u.active ? 'Active' : 'Deactivated'}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-2">
                    {u.active && <button type="button" className="btn-secondary text-red-600" onClick={() => setTarget(u)}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={!!target} danger loading={busy} title={`Deactivate ${target?.name}?`} message="They will no longer be able to request an OTP or log in. There is no way to reactivate an account from the app." confirmLabel="Deactivate" onConfirm={deactivate} onCancel={() => !busy && setTarget(null)} />
    </div>
  )
}
