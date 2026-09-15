import { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile } from '../api/profile'

const STATUS_LABEL = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING: 'Pending review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected - resubmit'
}

const STATUS_COLOR = {
  NOT_SUBMITTED: 'var(--color-ink-soft)',
  PENDING: 'var(--color-accent-dark)',
  VERIFIED: 'var(--color-green)',
  REJECTED: 'var(--color-rust)'
}

const emptyForm = {
  age: '',
  occupation: '',
  budget: '',
  preferredLocation: '',
  lifestylePreferences: '',
  moveInDate: '',
  profilePicUrl: '',
  verificationDocUrl: ''
}

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('NOT_SUBMITTED')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    getProfile(user.id)
      .then((res) => {
        if (res.success && res.data) {
          const p = res.data
          setForm({
            age: p.age ?? '',
            occupation: p.occupation ?? '',
            budget: p.budget ?? '',
            preferredLocation: p.preferredLocation ?? '',
            lifestylePreferences: p.lifestylePreferences ?? '',
            moveInDate: p.moveInDate ?? '',
            profilePicUrl: p.profilePicUrl ?? '',
            verificationDocUrl: ''
          })
          setStatus(p.verificationStatus)
        }
      })
      .catch((err) => {
        // 404 just means no profile created yet - that's fine, form stays empty
        if (err.response?.status !== 404) {
          setError('Could not load your profile.')
        }
      })
      .finally(() => setLoading(false))
  }, [user.id])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSavedMessage('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : null,
        budget: form.budget ? Number(form.budget) : null,
        moveInDate: form.moveInDate || null,
        verificationDocUrl: form.verificationDocUrl || null
      }
      const res = await upsertProfile(user.id, payload)
      if (!res.success) {
        setError(res.message)
        return
      }
      setStatus(res.data.verificationStatus)
      setForm((prev) => ({ ...prev, verificationDocUrl: '' }))
      setSavedMessage('Profile saved.')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <NavBar />
        <div className="page-content"><p>Loading your profile...</p></div>
      </div>
    )
  }

  return (
    <div className="page">
      <NavBar />
      <div className="page-content" style={{ alignItems: 'flex-start' }}>
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <h1>Your profile</h1>
          <p className="auth-subtitle">
            This is what other users see when deciding whether you're a good match.
          </p>

          <div style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
            Verification status:{' '}
            <strong style={{ color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</strong>
          </div>

          {error && <div className="banner banner-error">{error}</div>}
          {savedMessage && <div className="banner banner-dev-otp">{savedMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                min="18"
                value={form.age}
                onChange={(e) => updateField('age', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="occupation">Occupation</label>
              <input
                id="occupation"
                type="text"
                value={form.occupation}
                onChange={(e) => updateField('occupation', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="budget">Monthly budget (₹)</label>
              <input
                id="budget"
                type="number"
                min="0"
                value={form.budget}
                onChange={(e) => updateField('budget', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="preferredLocation">Preferred location</label>
              <input
                id="preferredLocation"
                type="text"
                placeholder="e.g. Koramangala"
                value={form.preferredLocation}
                onChange={(e) => updateField('preferredLocation', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="lifestylePreferences">Lifestyle preferences</label>
              <input
                id="lifestylePreferences"
                type="text"
                placeholder="e.g. non-smoker, vegetarian, early riser"
                value={form.lifestylePreferences}
                onChange={(e) => updateField('lifestylePreferences', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="moveInDate">Move-in date</label>
              <input
                id="moveInDate"
                type="date"
                value={form.moveInDate}
                onChange={(e) => updateField('moveInDate', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="profilePicUrl">Profile picture URL</label>
              <input
                id="profilePicUrl"
                type="url"
                placeholder="https://..."
                value={form.profilePicUrl}
                onChange={(e) => updateField('profilePicUrl', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="verificationDocUrl">
                Verification document URL {status === 'VERIFIED' && '(already verified)'}
              </label>
              <input
                id="verificationDocUrl"
                type="url"
                placeholder="https://... (submitting sends this for admin review)"
                value={form.verificationDocUrl}
                onChange={(e) => updateField('verificationDocUrl', e.target.value)}
              />
            </div>

            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
