import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as usersApi from '../api/users'
import * as listingsApi from '../api/listings'
import * as reportsApi from '../api/reports'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABEL } from '../constants/enums'
import { formatDate, formatDateTime } from '../utils/dates'
import { formatINR } from '../utils/money'
import { splitList } from '../utils/match'
import StatusBadge from '../components/StatusBadge'
import ListingCard from '../components/ListingCard'
import ConfirmDialog from '../components/ConfirmDialog'
import ReportModal from '../components/ReportModal'
import Spinner from '../components/Spinner'
import { ErrorState } from '../components/EmptyState'

export default function UserProfile() {
  const { id } = useParams()
  const { user: me, addBlocked, isBlocked } = useAuth()
  const navigate = useNavigate()
  const [person, setPerson] = useState(null)
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [u, p, ls] = await Promise.all([usersApi.getUser(id), usersApi.getProfile(id), listingsApi.byUser(id)])
      setPerson(u)
      setProfile(p)
      setListings(ls.filter((l) => l.status === 'ACTIVE'))
    } catch (e) {
      setError(e)
      if (e.response?.status !== 404) toastError(e, 'Could not load user')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Spinner />
  if (error?.response?.status === 404) return <ErrorState message="User not found." />
  if (error || !person) return <ErrorState message="We could not load this user." onRetry={load} />

  const isMe = person.id === me.id
  const blocked = isBlocked(person.id)
  const lifestyle = splitList(profile?.lifestylePreferences)

  const doBlock = async () => {
    setBusy(true)
    try {
      await reportsApi.block(me.id, person.id)
      addBlocked(person.id)
      toast.success(`${person.name} blocked`)
      navigate('/listings', { replace: true })
    } catch (e) {
      toastError(e, 'Could not block user')
      setBusy(false)
    }
  }

  const Field = ({ label, children }) => (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{children || <span className="font-normal text-slate-400">Not provided</span>}</dd>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {profile?.profilePicUrl ? (
              <img src={profile.profilePicUrl} alt="" className="h-14 w-14 rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700" aria-hidden="true">{person.name?.slice(0, 2).toUpperCase()}</span>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{person.name}</h1>
              <p className="text-sm text-slate-500">{ROLE_LABEL[person.role] || person.role}</p>
            </div>
          </div>
          {profile && <StatusBadge kind="verification" status={profile.verificationStatus} />}
        </div>

        {isMe && <Link to="/profile" className="btn-secondary">Edit my profile</Link>}

        {profile ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Age">{profile.age}</Field>
            <Field label="Occupation">{profile.occupation}</Field>
            <Field label="Monthly budget">{profile.budget != null ? formatINR(profile.budget) : null}</Field>
            <Field label="Preferred location">{profile.preferredLocation}</Field>
            <Field label="Move-in date">{profile.moveInDate ? formatDate(profile.moveInDate) : null}</Field>
            <Field label="Profile updated">{profile.updatedAt ? formatDateTime(profile.updatedAt) : null}</Field>
            <div className="sm:col-span-2">
              <dt className="mb-1 text-sm text-slate-500">Lifestyle</dt>
              <dd>{lifestyle.length ? <div className="flex flex-wrap gap-1.5">{lifestyle.map((l) => <span key={l} className="chip">{l}</span>)}</div> : <span className="text-sm text-slate-400">Not provided</span>}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-slate-500">This user hasn't completed their profile</p>
        )}

        {!isMe && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {!blocked && <Link to={`/chat/${person.id}`} className="btn-primary">Message</Link>}
            <button type="button" className="btn-secondary" onClick={() => setReportOpen(true)}>Report</button>
            {!blocked && <button type="button" className="btn-secondary text-red-600" onClick={() => setBlockOpen(true)}>Block</button>}
            {blocked && <Link to="/blocked" className="btn-secondary">You blocked this user</Link>}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Active listings</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-slate-500">No active listings.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">{listings.map((l) => <ListingCard key={l.id} listing={l} me={me} />)}</div>
        )}
      </section>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} reportedUserId={person.id} targetLabel={person.name} />
      <ConfirmDialog open={blockOpen} danger loading={busy} title={`Block ${person.name}?`} message="You will no longer see their listings or conversations. You can unblock them later from the Blocked users page." confirmLabel="Block" onConfirm={doBlock} onCancel={() => !busy && setBlockOpen(false)} />
    </div>
  )
}
