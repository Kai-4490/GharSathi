import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', mobileNumber: '', role: 'SEEKER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await register(form)
      if (!res.success) {
        setError(res.message)
        return
      }
      // dev mode: backend returns the OTP inline in the message since no SMS
      // provider is wired up yet - pass it along so the next screen can show it
      const otpMatch = res.message.match(/otp=(\d+)/)
      navigate('/verify-otp', {
        state: {
          mobileNumber: form.mobileNumber,
          devOtp: otpMatch ? otpMatch[1] : null
        }
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-content">
        <div className="auth-shell">
          <h1>Find your next flatmate</h1>
          <p className="auth-subtitle">Create an account to start browsing or posting.</p>

          {error && <div className="banner banner-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email (optional)</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="mobileNumber">Mobile number</label>
              <input
                id="mobileNumber"
                type="tel"
                required
                value={form.mobileNumber}
                onChange={(e) => updateField('mobileNumber', e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="role">I am a...</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => updateField('role', e.target.value)}
              >
                <option value="SEEKER">Seeker (looking for a flat/roommate)</option>
                <option value="FLAT_POSTER">Flat Poster (have a place to share)</option>
              </select>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
