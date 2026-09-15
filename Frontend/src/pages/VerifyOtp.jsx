import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyOtp } from '../api/auth'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const mobileNumber = location.state?.mobileNumber || ''
  const devOtp = location.state?.devOtp || null

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await verifyOtp({ mobileNumber, otp })
      if (!res.success) {
        setError(res.message)
        return
      }
      navigate('/login', { state: { mobileNumber, verified: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!mobileNumber) {
    return (
      <div className="page">
        <div className="page-content">
          <div className="auth-shell">
            <h1>No number to verify</h1>
            <p className="auth-subtitle">Start from the registration page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content">
        <div className="auth-shell">
          <h1>Verify your number</h1>
          <p className="auth-subtitle">Enter the code sent to {mobileNumber}.</p>

          {devOtp && (
            <div className="banner banner-dev-otp">
              Dev mode - no SMS provider connected yet. Your code is: <strong>{devOtp}</strong>
            </div>
          )}

          {error && <div className="banner banner-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="otp">6-digit code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
