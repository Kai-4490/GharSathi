import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as usersApi from '../api/users'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABEL } from '../constants/enums'
import { formatDateTime, toDateInput } from '../utils/dates'
import { emptyToNull, isValidEmail, numOrNull } from '../utils/normalize'
import { splitList } from '../utils/match'
import ChipInput from '../components/ChipInput'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import { ErrorState } from '../components/EmptyState'

const VERIFY_HELP = {
  NOT_SUBMITTED: 'Add a link to an ID document below and save to request verification.',
  PENDING: 'An admin is reviewing your document. This can take a little while.',
  VERIFIED: 'Your identity is verified. Others will see a verified badge on your profile.',
  REJECTED: 'Your document was rejected. Submit a new document link to try again.',
}

export default function Profile() {
  const { user, logout, updateStoredUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [account, setAccount] = useState({ name: user.name, email: user.email || '' })
  const [accountErrors, setAccountErrors] = useState({})
  const [accountBusy, setAccountBusy] = useState(false)

  const [form, setForm] = useState({ age: '', occupation: '', budget: '', preferredLocation: '', moveInDate: '', profilePicUrl: '', verificationDocUrl: '' })
  const [lifestyle, setLifestyle] = useState([])
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const fill = useCallback((p) => {
    setForm({
      age: p?.age ?? '',
      occupation: p?.occupation ?? '',
      budget: p?.budget ?? '',
      preferredLocation: p?.preferredLocation ?? '',
      moveInDate: toDateInput(p?.moveInDate),
      profilePicUrl: p?.profilePicUrl ?? '',
      verificationDocUrl: p?.verificationDocUrl ?? '',
    })
    setLifestyle(splitList(p?.lifestylePreferences))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const p = await usersApi.getProfile(user.id) // null on 404
      setProfile(p)
      fill(p)
    } catch (e) {
      setLoadError(true)
      toastError(e, 'Could not load profile')
    } finally {
      setLoading(false)
    }
  }, [user.id, fill])

  useEffect(() => {
    load()
  }, [load])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const saveAccount = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!account.name.trim()) errs.name = 'Name cannot be blank'
    if (account.email.trim() && !isValidEmail(account.email.trim())) errs.email = 'Enter a valid email address'
    setAccountErrors(errs)
    if (Object.keys(errs).length) return
    setAccountBusy(true)
    try {
      const updated = await usersApi.updateUser(user.id, emptyToNull({ name: account.name.trim(), email: account.email.trim() }))
      updateStoredUser(updated)
      toast.success('Account updated')
    } catch (err) {
      toastError(err, 'Could not update account')
    } finally {
      setAccountBusy(false)
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    const age = numOrNull(form.age)
    const budget = numOrNull(form.budget)
    const errs = {}
    if (age != null && (!Number.isInteger(age) || age < 18 || age > 100)) errs.age = 'Age must be a whole number from 18 to 100'
    if (budget != null && budget < 0) errs.budget = 'Budget cannot be negative'
    setErrors(errs)
    if (Object.keys(errs).length) return

    // Backend resets verification to PENDING whenever a non-blank doc URL is sent, even an unchanged one.
    // So only send the doc URL when the user actually changed it.
    const docNow = form.verificationDocUrl.trim()
    const docWas = (profile?.verificationDocUrl || '').trim()
    const body = emptyToNull({
      age,
      occupation: form.occupation.trim(),
      budget,
      preferredLocation: form.preferredLocation.trim(),
      lifestylePreferences: lifestyle.length ? lifestyle.join(', ') : '',
      moveInDate: form.moveInDate,
      profilePicUrl: form.profilePicUrl.trim(),
      verificationDocUrl: docNow && docNow !== docWas ? docNow : '',
    })
    setBusy(true)
    try {
      const saved = await usersApi.saveProfile(user.id, body)
      toast.success('Profile saved')
      setProfile(saved)
      fill(saved)
    } catch (err) {
      toastError(err, 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  const deactivate = async () => {
    setDeactivating(true)
    try {
      await usersApi.deactivateUser(user.id)
      toast.success('Account deactivated')
      logout()
      navigate('/login', { replace: true })
    } catch (e) {
      toastError(e, 'Could not deactivate account')
      setDeactivating(false)
    }
  }

  if (loading) return <Spinner />
  if (loadError) return <ErrorState message="We could not load your profile." onRetry={load} />

  const status = profile?.verificationStatus || 'NOT_SUBMITTED'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My profile</h1>

      {!profile && (
        <div role="status" className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Complete your profile to get roommate suggestions
        </div>
      )}

      <form onSubmit={saveAccount} noValidate className="card space-y-4 p-5" aria-labelledby="account-h">
        <h2 id="account-h" className="text-lg font-semibold text-slate-900">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="a-mobile" className="label">Mobile number</label>
            <input id="a-mobile" className="input" value={user.mobileNumber} readOnly disabled />
          </div>
          <div>
            <label htmlFor="a-role" className="label">Role</label>
            <input id="a-role" className="input" value={ROLE_LABEL[user.role] || user.role} readOnly disabled />
          </div>
        </div>
        <div>
          <label htmlFor="a-name" className="label">Name</label>
          <input id="a-name" className="input" value={account.name} onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))} />
          {accountErrors.name && <p className="field-error">{accountErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="a-email" className="label">Email</label>
          <input id="a-email" type="email" className="input" value={account.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} />
          {accountErrors.email && <p className="field-error">{accountErrors.email}</p>}
          <p className="mt-1 text-xs text-slate-500">Leaving a field blank keeps the saved value.</p>
        </div>
        <button type="submit" className="btn-primary" disabled={accountBusy}>{accountBusy ? 'Saving…' : 'Save account'}</button>
      </form>

      <form onSubmit={saveProfile} noValidate className="card space-y-4 p-5" aria-labelledby="profile-h">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="profile-h" className="text-lg font-semibold text-slate-900">Profile</h2>
          <StatusBadge kind="verification" status={status} />
        </div>
        <p className="text-sm text-slate-600">{VERIFY_HELP[status]}</p>
        {profile?.updatedAt && <p className="text-xs text-slate-400">Last updated {formatDateTime(profile.updatedAt)}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-age" className="label">Age</label>
            <input id="p-age" type="number" min="18" max="100" className="input" value={form.age} onChange={set('age')} />
            {errors.age && <p className="field-error">{errors.age}</p>}
          </div>
          <div>
            <label htmlFor="p-occ" className="label">Occupation</label>
            <input id="p-occ" className="input" value={form.occupation} onChange={set('occupation')} />
          </div>
          <div>
            <label htmlFor="p-budget" className="label">Monthly budget (₹)</label>
            <input id="p-budget" type="number" min="0" className="input" value={form.budget} onChange={set('budget')} />
            {errors.budget && <p className="field-error">{errors.budget}</p>}
          </div>
          <div>
            <label htmlFor="p-loc" className="label">Preferred location</label>
            <input id="p-loc" className="input" value={form.preferredLocation} onChange={set('preferredLocation')} placeholder="e.g. Andheri" />
            <p className="mt-1 text-xs text-slate-500">A short area name works best, e.g. "Andheri" rather than a full address.</p>
          </div>
        </div>

        <ChipInput id="p-life" label="Lifestyle preferences" value={lifestyle} onChange={setLifestyle} placeholder="e.g. non-smoker" helper="Use short single-word keywords (non-smoker, vegetarian, night-owl). Shared keywords raise your compatibility score." />

        <div>
          <label htmlFor="p-move" className="label">Move-in date</label>
          <input id="p-move" type="date" className="input" value={form.moveInDate} onChange={set('moveInDate')} />
        </div>
        <div>
          <label htmlFor="p-pic" className="label">Profile photo URL</label>
          <input id="p-pic" type="url" className="input" value={form.profilePicUrl} onChange={set('profilePicUrl')} placeholder="https://…" />
          <p className="mt-1 text-xs text-slate-500">Photo upload is not available yet; paste a link to an image.</p>
        </div>
        <div>
          <label htmlFor="p-doc" className="label">Verification document URL</label>
          <input id="p-doc" type="url" className="input" value={form.verificationDocUrl} onChange={set('verificationDocUrl')} placeholder="https://…" />
          <p className="mt-1 text-xs text-slate-500">Submitting a new link sends your profile for admin review.</p>
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>

      <section className="card space-y-3 border-red-200 p-5" aria-labelledby="danger-h">
        <h2 id="danger-h" className="text-lg font-semibold text-red-700">Danger zone</h2>
        <p className="text-sm text-slate-600">Deactivating your account logs you out and you will not be able to log in again. This cannot be undone from the app.</p>
        <button type="button" className="btn-danger" onClick={() => setDeactivateOpen(true)}>Deactivate my account</button>
      </section>

      <ConfirmDialog open={deactivateOpen} danger loading={deactivating} title="Deactivate your account?" message="You will be logged out immediately and will not be able to log in again. This cannot be undone from the app." confirmLabel="Deactivate account" onConfirm={deactivate} onCancel={() => !deactivating && setDeactivateOpen(false)} />
    </div>
  )
}
